import { Component, OnInit, ViewChild, NgZone, OnDestroy, HostListener } from '@angular/core';
import { OnlineProjectLoader } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MonacoRecorder } from 'src/app/sub-components/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording-file-tree/recording-file-tree.component';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { RecordingWebCamComponent } from 'src/app/sub-components/recording-web-cam/recording-web-cam.component';
import { WebCamRecorder } from 'src/app/sub-components/recorder/webcam.recorder';
import { TutorBitsTutorialService } from 'src/app/services/tutorial/tutor-bits-tutorial.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IVideoService } from 'src/app/services/abstract/IVideoService';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { Observable } from 'rxjs';
import { ComponentCanDeactivate } from 'src/app/services/guards/tutor-bits-pending-changes-guard.service';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { GoToDefinitionEvent } from 'src/app/sub-components/editor/monaco-editor.component';

@Component({
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass']
})
export class RecordComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  public tutorialId: string;
  tutorial: ViewTutorial;
  public recording = false;
  hasRecorded = false;
  saving = false;
  streamInitialized = false;
  finishRecording = false;
  loadingRecording = false;
  editorInitialized = false;
  timeout = 1000 * 60 * 15;
  timeoutWarning = this.timeout - (1000 * 60 * 2);
  confirmMessage = 'WARNING: You will lose your current recording if you navigate away!';

  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;
  @ViewChild(RecordingWebCamComponent, { static: true }) recordingWebCam: RecordingWebCamComponent;
  @ViewChild(ResourceViewerComponent, { static: true }) resourceViewerComponent: ResourceViewerComponent;
  @ViewChild(PreviewComponent, { static: true }) previewComponent: PreviewComponent;

  codeRecorder: MonacoRecorder;
  webCamRecorder: WebCamRecorder;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj = new ApiHttpRequest(this.requestInfo);
  streamErrored = false;

  timeoutWarningTimer: any;
  timeoutTimer: any;

  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private projectService: ITracerProjectService,
    private videoRecordingService: IVideoService,
    private eventService: IEventService,
    private tutorialService: TutorBitsTutorialService,
    private titleService: ITitleService) {
    this.tutorialId = this.route.snapshot.paramMap.get('tutorialId');
    this.hasRecorded = this.route.snapshot.queryParamMap.get('back') === 'true';
  }

  public get canRecord(): boolean {
    return this.streamInitialized && this.editorInitialized && !!this.tutorial;
  }

  async ngOnInit() {
    try {
      const tutorial: ViewTutorial = await this.tutorialService.Get(this.tutorialId);
      this.titleService.SetTitle(`Recording: ${tutorial.title}`);
      this.zone.runTask(() => {
        this.tutorial = tutorial;
      });
    } catch (e) {
      this.errorServer.HandleError('Record', e);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
      this.timeoutWarningTimer = null;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  async onStreamInitialized(webCam: RecordingWebCamComponent) {
    if (this.streamErrored) {
      this.streamErrored = false;
      this.errorServer.ClearError();
    }
    this.logServer.LogToConsole('Record', webCam.stream);
    this.zone.runTask(() => {
      this.streamInitialized = true;
    });
    this.webCamRecorder = new WebCamRecorder(this.recordingWebCam, this.videoRecordingService, this.tutorialId);
    await this.webCamRecorder.Initialize();
  }

  onStreamError(e: any) {
    this.streamErrored = true;
    this.errorServer.HandleError('WebCamError', e);
  }

  onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    this.recordingEditor.AllowEdits(false);
    this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, '/project');
    this.zone.runTask(() => {
      this.editorInitialized = true;
    });
  }

  onGoToDefinition(event: GoToDefinitionEvent) {
    this.logServer.LogToConsole(JSON.stringify(event));

    this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, event.path);
    this.zone.runTask(() => {
      this.recordingEditor.codeEditor.focus();
      this.recordingEditor.codeEditor.setPosition(event.offset);
    });
  }

  resetState() {
    this.recordingTreeComponent.treeComponent.treeModel = this.recordingTreeComponent.tree;
    this.recordingTreeComponent.treeComponent.ngOnChanges(null);
    this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, '/project');
    this.recordingEditor.ClearCacheForFolder('/');
    this.recordingEditor.currentFilePath = '';
  }

  async StartRecording() {
    if (this.hasRecorded) {
      if (!confirm('Are you sure you want to start the recording over?')) {
        return;
      }

      this.resetState();
    }

    this.timeoutTimer = setTimeout(() => {
      this.errorServer.HandleError('Timeout', 'Max time reached ending recording');
      this.onRecordingStateChanged(false);
      this.timeoutTimer = null;
    }, this.timeout);

    this.timeoutWarningTimer = setTimeout(() => {
      this.errorServer.HandleError('TimeoutWarning', 'You are about to reach max recording time. Please wrap up stream within 5 minutes');
      this.timeoutWarningTimer = null;
    }, this.timeoutWarning);

    this.webCamRecorder = new WebCamRecorder(this.recordingWebCam, this.videoRecordingService, this.tutorial.videoId);
    try {
      await this.webCamRecorder.Initialize();
    } catch (e) {
      this.errorServer.HandleError('Record', `Failed loading video recorder ${e}`);
      return;
    }

    this.loadingRecording = true;
    this.codeRecorder = new MonacoRecorder(
      this.recordingEditor,
      this.recordingTreeComponent,
      this.resourceViewerComponent,
      this.previewComponent,
      this.logServer,
      this.errorServer,
      true, /* resourceAuth */
      this.tutorial.projectId,
      this.projectService,
      this.projectService,
      this.projectService,
      this.projectService,
      true);

    try {
      const proj = await this.codeRecorder.LoadProject(this.tutorial.projectId);
      if (proj.getDuration() > 0 && !confirm('Are you sure you want to start the recording over?')) {
        this.loadingRecording = false;
        this.recording = false;
        this.hasRecorded = true;
        return;
      }

    } catch (e) {
      this.errorServer.HandleError('Record', `Failed loading project ${e}`);
      return;
    }

    try {
      await this.codeRecorder.ResetProject(this.tutorial.projectId);
      await this.codeRecorder.Load();
      this.codeRecorder.Reset();
      await this.webCamRecorder.StartRecording();
      this.loadingRecording = false;
      this.hasRecorded = true;
      this.codeRecorder.StartRecording();
      this.recordingTreeComponent.allowEdit(true);
      this.recordingEditor.AllowEdits(true);
      this.recording = true;
    } catch (e) {
      this.errorServer.HandleError('Record', `Failed start record ${e}`);
    }
  }

  async StopRecording() {
    this.recording = false;
    this.recordingTreeComponent.allowEdit(false);
    this.recordingEditor.AllowEdits(false);
    this.saving = true;
    try {
      await Promise.all([
        this.webCamRecorder.FinishRecording(),
        this.codeRecorder.StopRecording()
      ]);
      this.logServer.LogToConsole('Record', 'Finished recording');
    } catch (e) {
      this.errorServer.HandleError('Record', `Failed saving recording ${e}`);
      this.hasRecorded = false;
      this.resetState();
    }
    this.saving = false;
  }

  resetTimeoutTimers() {
    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
      this.timeoutWarningTimer = null;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  async onRecordingStateChanged(recording: boolean) {
    this.eventService.TriggerButtonClick('Record', `Record - ${this.tutorialId}`);
    this.resetTimeoutTimers();

    if (recording) {
      await this.StartRecording();
    } else {
      await this.StopRecording();
    }
  }

  public onCloseClicked(e: any) {
    this.eventService.TriggerButtonClick('Record', `PreviewClose - ${this.tutorialId}`);
    this.previewComponent.ClosePreview();
  }

  public async onPreviewClicked(e: string) {
    this.eventService.TriggerButtonClick('Record', `Preview - ${this.tutorialId} - ${e}`);
    const previewPos = Math.round(this.codeRecorder.position);
    try {
      await this.previewComponent.GeneratePreview(this.tutorial.projectId, previewPos, e, this.codeRecorder.logs);
    } catch (err) {
      this.errorServer.HandleError('PreviewError', err);
    }
  }

  onFinishClicked() {
    this.eventService.TriggerButtonClick('Record', `Finish - ${this.tutorialId}`);
    this.finishRecording = true;
    this.router.navigate([`watch/${this.tutorialId}`], { queryParams: { publish: 'true' } });
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    return !this.recording;
  }
}
