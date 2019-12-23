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
import { OnlinePreviewGenerator } from 'shared/Tracer/lib/ts/OnlinePreviewGenerator';
import { TutorBitsTutorialService } from 'src/app/services/tutor-bits-tutorial.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { ITracerTransactionService } from 'src/app/services/abstract/ITracerTransactionService';
import { IVideoRecordingService } from 'src/app/services/abstract/IVideoRecordingService';
import { FileUploadData } from 'src/app/sub-components/file-tree/ng2-file-tree.component';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { Observable } from 'rxjs';
import { ComponentCanDeactivate } from 'src/app/services/guards/tutor-bits-pending-changes-guard.service';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';

@Component({
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass']
})
export class RecordComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  public projectId: string;
  public recording = false;
  hasRecorded = false;
  saving = false;
  canRecord = false;
  finishRecording = false;
  loadingRecording = false;
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
    private router: Router,
    private route: ActivatedRoute,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private tracerProjectService: ITracerProjectService,
    private tracerTransactionService: ITracerTransactionService,
    private videoRecordingService: IVideoRecordingService,
    private eventService: IEventService,
    private tutorialService: TutorBitsTutorialService,
    private titleService: ITitleService) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.hasRecorded = this.route.snapshot.queryParamMap.get('back') === 'true';
  }

  ngOnInit(): void {
    this.tutorialService.Get(this.projectId).then((tutorial: ViewTutorial) => {
      this.titleService.SetTitle(`Recording: ${tutorial.title}`);
    });
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

  onStreamInitialized(webCam: RecordingWebCamComponent) {
    if (this.streamErrored) {
      this.streamErrored = false;
      this.errorServer.ClearError();
    }
    this.logServer.LogToConsole('Record', webCam.stream);
    this.canRecord = true;
    this.webCamRecorder = new WebCamRecorder(this.recordingWebCam, this.videoRecordingService, this.projectId);
    this.webCamRecorder.Initialize().then(() => {
    });
  }

  onStreamError(e: any) {
    this.streamErrored = true;
    this.errorServer.HandleError('WebCamError', e);
  }

  onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    this.recordingEditor.AllowEdits(false);
    this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, '/project');
  }

  startRecording(): void {
    this.codeRecorder.DeleteProject(this.projectId).then(() => {
      this.codeRecorder.New().then(() => {
        this.webCamRecorder.StartRecording().then(() => {
          this.loadingRecording = false;
          this.hasRecorded = true;
          this.codeRecorder.StartRecording();
          this.recordingTreeComponent.allowEdit(true);
          this.recordingEditor.AllowEdits(true);
          this.recording = true;
        }).catch((err) => {
          this.errorServer.HandleError('LoadingError', err);
          this.loadingRecording = false;
          this.recording = false;
        });
      }).catch((err) => {
        this.errorServer.HandleError('LoadingError', err);
        this.loadingRecording = false;
        this.recording = false;
      });
    });
  }

  resetState() {
    this.recordingTreeComponent.treeComponent.treeModel = this.recordingTreeComponent.tree;
    this.recordingTreeComponent.treeComponent.ngOnChanges(null);
    this.recordingTreeComponent.selectNodeByPath(this.recordingTreeComponent.treeComponent.tree, '/project');
    this.recordingEditor.ClearCacheForFolder('/');
    this.recordingEditor.currentFilePath = '';
  }

  onRecordingStateChanged(recording: boolean) {
    this.eventService.TriggerButtonClick('Record', `Record - ${this.projectId}`);
    if (this.timeoutWarningTimer) {
      clearTimeout(this.timeoutWarningTimer);
      this.timeoutWarningTimer = null;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    if (recording) {
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

      this.webCamRecorder = new WebCamRecorder(this.recordingWebCam, this.videoRecordingService, this.projectId);
      this.webCamRecorder.Initialize().then(() => {
      });

      this.loadingRecording = true;
      this.codeRecorder = new MonacoRecorder(
        this.recordingEditor,
        this.recordingTreeComponent,
        this.resourceViewerComponent,
        this.previewComponent,
        this.logServer,
        this.errorServer,
        true, /* resourceAuth */
        this.projectId,
        new OnlineProjectLoader(this.requestObj),
        this.tracerProjectService,
        this.tracerTransactionService,
        this.tracerProjectService,
        true);

      this.codeRecorder.LoadProject(this.projectId).then((proj) => {
        if (proj.getDuration() > 0 && !confirm('Are you sure you want to start the recording over?')) {
          this.loadingRecording = false;
          this.recording = false;
          this.hasRecorded = true;
          return;
        }
        this.startRecording();
      }).catch((e) => {
        this.startRecording();
      });

    } else {
      this.recording = false;
      this.recordingTreeComponent.allowEdit(false);
      this.recordingEditor.AllowEdits(false);
      this.saving = true;
      Promise.all([this.webCamRecorder.FinishRecording(),
      this.codeRecorder.StopRecording()
      ]).then(() => {
        this.logServer.LogToConsole('Record', 'Finished recording');
      }).catch((e) => {
        this.errorServer.HandleError('Record', `Failed saving recording ${e}`);
        this.hasRecorded = false;
        this.resetState();
      }).finally(() => {
        this.saving = false;
      });
    }
  }

  public onCloseClicked(e: any) {
    this.eventService.TriggerButtonClick('Record', `PreviewClose - ${this.projectId}`);
    this.previewComponent.ClosePreview();
  }

  public onPreviewClicked(e: string) {
    this.eventService.TriggerButtonClick('Record', `Preview - ${this.projectId} - ${e}`);
    const previewPos = Math.round(this.codeRecorder.position);
    this.previewComponent.GeneratePreview(this.projectId, previewPos, e, this.codeRecorder.logs)
      .then()
      .catch((err) => {
        this.errorServer.HandleError('PreviewError', err);
      });
  }

  onFinishClicked() {
    this.eventService.TriggerButtonClick('Record', `Finish - ${this.projectId}`);
    this.finishRecording = true;
    this.router.navigate([`watch/${this.projectId}`], { queryParams: { publish: 'true' } });
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    return !this.recording;
  }
}
