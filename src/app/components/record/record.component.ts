import { Component, OnInit, ViewChild } from '@angular/core';
import { OnlineProjectLoader, OnlineProjectWriter, OnlineTransactionWriter } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MonacoRecorder } from 'src/app/sub-components/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording-file-tree/recording-file-tree.component';
import { ApiHttpRequestInfo, ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { RecordingWebCamComponent } from 'src/app/sub-components/recording-web-cam/recording-web-cam.component';
import { WebCamRecorder } from 'src/app/sub-components/recorder/webcam.recorder';
import { OnlineStreamWriter } from 'shared/media/lib/ts/OnlineStreamWriter';

@Component({
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass']
})
export class RecordComponent implements OnInit {
  public projectId: string;
  public recording = false;
  hasRecorded = false;

  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;
  @ViewChild(RecordingWebCamComponent, { static: true }) recordingWebCam: RecordingWebCamComponent;

  codeRecorder: MonacoRecorder;
  webCamRecorder: WebCamRecorder;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj = new ApiHttpRequest(this.requestInfo);

  constructor(private route: ActivatedRoute) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
  }

  ngOnInit(): void {
  }

  onStreamInitialized(webCam: RecordingWebCamComponent) {
    console.log(webCam.stream);
    this.webCamRecorder = new WebCamRecorder(this.recordingWebCam, new OnlineStreamWriter(this.projectId, this.requestObj));
    this.webCamRecorder.Initialize().then(() => {
    });
  }

  onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    this.recordingEditor.AllowEdits(false);
  }

  onRecordingStateChanged(recording: boolean) {
    this.recordingTreeComponent.allowEdit(recording);
    this.recordingEditor.AllowEdits(recording);

    if (recording) {
      if (this.hasRecorded) {
        if (!confirm('Are you sure you want to start the recording over?')) {
          return;
        }

        this.recordingTreeComponent.treeComponent.treeModel = this.recordingTreeComponent.tree;
        this.recordingTreeComponent.treeComponent.ngOnChanges(null);
        this.recordingEditor.ClearCacheForFolder('/');
        this.recordingEditor.Show(false);
      }

      this.webCamRecorder = new WebCamRecorder(this.recordingWebCam, new OnlineStreamWriter(this.projectId, this.requestObj));
      this.webCamRecorder.Initialize().then(() => {
      });

      this.codeRecorder = new MonacoRecorder(
        this.recordingEditor,
        this.recordingTreeComponent,
        this.projectId,
        new OnlineProjectLoader(this.requestObj),
        new OnlineProjectWriter(this.requestObj),
        new OnlineTransactionWriter(this.requestObj, this.projectId));

      this.codeRecorder.DeleteProject(this.projectId).then(() => {
        this.codeRecorder.New().then(() => {
          this.hasRecorded = true;
          this.codeRecorder.StartRecording();
          this.webCamRecorder.StartRecording().then();
        });
      });
    } else {
      this.codeRecorder.StopRecording();
      this.webCamRecorder.FinishRecording().then();
    }
  }
}
