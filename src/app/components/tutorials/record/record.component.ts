import { Component, OnInit, ViewChild, NgZone, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { RecordingEditorComponent } from 'src/app/sub-components/recording/recording-editor/recording-editor.component';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { RecordingWebCamComponent } from 'src/app/sub-components/recording/recording-web-cam/recording-web-cam.component';
import { WebCamRecorder } from 'src/app/sub-components/recording/recorder/webcam.recorder';
import { TutorBitsTutorialService } from 'src/app/services/tutorial/tutor-bits-tutorial.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IVideoService } from 'src/app/services/abstract/IVideoService';
import { Observable } from 'rxjs';
import { ComponentCanDeactivate } from 'src/app/services/guards/tutor-bits-pending-changes-guard.service';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { ICodeService, CodeEvents, GoToDefinitionEvent } from 'src/app/services/abstract/ICodeService';
import { IFileTreeService, FileTreeEvents } from 'src/app/services/abstract/IFileTreeService';
import { IRecorderService, RecorderSettings } from 'src/app/services/abstract/IRecorderService';
import { ICurrentTracerProjectService } from 'src/app/services/abstract/ICurrentTracerProjectService';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';

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

  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;
  @ViewChild(RecordingWebCamComponent, { static: true }) recordingWebCam: RecordingWebCamComponent;

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
    private videoRecordingService: IVideoService,
    private eventService: IEventService,
    private tutorialService: TutorBitsTutorialService,
    private titleService: ITitleService,
    private codeService: ICodeService,
    private fileTreeService: IFileTreeService,
    private recorderService: IRecorderService,
    private currentProjectService: ICurrentTracerProjectService,
    private previewService: IPreviewService) {
    this.tutorialId = this.route.snapshot.paramMap.get('tutorialId');
    this.hasRecorded = this.route.snapshot.queryParamMap.get('back') === 'true';
    this.currentProjectService.ClearCurrentProject();
    this.currentProjectService.baseProjectId = null;
  }

  public get canRecord(): boolean {
    return this.streamInitialized && this.editorInitialized && !!this.tutorial;
  }

  async ngOnInit() {
    this.fileTreeService.on(FileTreeEvents[FileTreeEvents.SelectedNode], async () => {
      this.eventService.TriggerButtonClick('Record', `PreviewClose - ${this.tutorialId}`);
      await this.previewService.HidePreview();
    });

    this.codeService.once(CodeEvents[CodeEvents.InitializedSession], () => { this.onCodeInitialized(); });
    this.codeService.on(CodeEvents[CodeEvents.GotoDefinition], (e) => {
      this.onGoToDefinition(e);
    });

    try {
      const tutorial: ViewTutorial = await this.tutorialService.GetCached(this.tutorialId);
      this.titleService.SetTitle(`Recording: ${tutorial.title}`);
      this.zone.runTask(() => {
        this.tutorial = tutorial;
      });
    } catch (e) {
      this.errorServer.HandleError('Record', e);
    }
  }

  async ngOnDestroy(): Promise<void> {
    if (this.recording) {
      await this.StopRecording();
    }

    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
      this.timeoutWarningTimer = null;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    this.currentProjectService.ClearCurrentProject();
    this.currentProjectService.baseProjectId = null;
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

  onCodeInitialized() {
    this.codeService.AllowEdits(false);
    this.fileTreeService.selectedPath = '/project';
    this.zone.runTask(() => {
      this.editorInitialized = true;
    });
  }

  onGoToDefinition(event: GoToDefinitionEvent) {
    this.logServer.LogToConsole(JSON.stringify(event));

    this.fileTreeService.selectedPath = event.path;
    this.zone.runTask(() => {
      this.codeService.editor.focus();
      this.codeService.editor.setPosition(event.offset);
    });
  }

  resetState() {
    this.fileTreeService.Reset();
    this.fileTreeService.selectedPath = '/project';
    this.codeService.ClearCacheForFolder('/');
    this.codeService.currentFilePath = '';
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

    await this.currentProjectService.LoadProject(true/*Online*/, this.tutorial.projectId);
    try {
      if (this.currentProjectService.project.getDuration() > 0 && !confirm('Are you sure you want to start the recording over?')) {
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
      await this.currentProjectService.ResetProject();
      await this.webCamRecorder.StartRecording();
      this.loadingRecording = false;
      this.hasRecorded = true;
      this.recorderService.StartRecording({
        load: true,
        local: false,
        trackNonFileEvents: true,
        useCachedProject: true
      } as RecorderSettings);
      this.fileTreeService.editable = true;
      this.codeService.AllowEdits(true);
      this.recording = true;
    } catch (e) {
      this.errorServer.HandleError('Record', `Failed start record ${e}`);
    }
  }

  async StopRecording() {
    this.recording = false;
    this.fileTreeService.editable = false;
    this.codeService.AllowEdits(false);
    this.saving = true;
    try {
      await Promise.all([
        this.webCamRecorder.FinishRecording(),
        this.recorderService.StopRecording()
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
