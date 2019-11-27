import { Component, OnInit, ViewChild, NgZone, OnDestroy } from '@angular/core';
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

@Component({
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass']
})
export class RecordComponent implements OnInit, OnDestroy {
  public projectId: string;
  public recording = false;
  hasRecorded = false;
  saving = false;
  canRecord = false;
  finishRecording = false;
  loadingRecording = false;

  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;
  @ViewChild(RecordingWebCamComponent, { static: true }) recordingWebCam: RecordingWebCamComponent;
  @ViewChild(ResourceViewerComponent, { static: true }) resourceViewerComponent: ResourceViewerComponent;

  codeRecorder: MonacoRecorder;
  webCamRecorder: WebCamRecorder;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj = new ApiHttpRequest(this.requestInfo);
  previewPath: string = null;
  previewBaseUrl: string = null;
  loadingPreview = false;
  streamErrored = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private tutorialService: TutorBitsTutorialService,
    private tracerProjectService: ITracerProjectService,
    private tracerTransactionService: ITracerTransactionService,
    private videoRecordingService: IVideoRecordingService) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

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
  }

  onRecordingStateChanged(recording: boolean) {
    if (recording) {
      if (this.hasRecorded) {
        if (!confirm('Are you sure you want to start the recording over?')) {
          return;
        }

        this.recordingTreeComponent.treeComponent.treeModel = this.recordingTreeComponent.tree;
        this.recordingTreeComponent.treeComponent.ngOnChanges(null);
        this.recordingEditor.ClearCacheForFolder('/');
        this.recordingEditor.currentFilePath = '';
      }


      this.webCamRecorder = new WebCamRecorder(this.recordingWebCam, this.videoRecordingService, this.projectId);
      this.webCamRecorder.Initialize().then(() => {
      });

      this.loadingRecording = true;
      this.codeRecorder = new MonacoRecorder(
        this.recordingEditor,
        this.recordingTreeComponent,
        this.resourceViewerComponent,
        this.logServer,
        this.errorServer,
        this.projectId,
        new OnlineProjectLoader(this.requestObj),
        this.tracerProjectService,
        this.tracerTransactionService,
        this.tracerProjectService);

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
    } else {
      this.recording = false;
      this.recordingTreeComponent.allowEdit(false);
      this.recordingEditor.AllowEdits(false);
      this.saving = true;
      Promise.all([this.webCamRecorder.FinishRecording(),
      this.codeRecorder.StopRecording()
      ]).then(() => {
        this.logServer.LogToConsole('Record', 'Finished recording');
      }).finally(() => {
        this.saving = false;
      });
    }
  }

  public onCloseClicked(e: any) {
    this.previewPath = null;
    this.loadingPreview = false;
  }

  public onPreviewClicked(e: string) {
    const previewGenerator = new OnlinePreviewGenerator(this.requestObj);
    const previewPos = Math.round(this.codeRecorder.position);
    this.loadingPreview = true;
    previewGenerator.GeneratePreview(this.projectId, previewPos, this.codeRecorder.logs).then((url) => {
      if (!url) {
        this.errorServer.HandleError('PreviewError', ' preview url failed to be retrieved');
        return;
      }
      this.zone.runTask(() => {
        this.previewBaseUrl = url;
        this.previewPath = e;
      });
    }).catch((err) => {
      this.errorServer.HandleError('PreviewError', err);
    }).finally(() => {
      this.loadingPreview = false;
    });
  }

  onFinishClicked() {
    this.finishRecording = true;
    this.router.navigate([`watch/${this.projectId}`], { queryParams: { publish: 'true' } });
  }
}
