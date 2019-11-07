import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
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
import { OnlinePreviewGenerator } from 'shared/Tracer/lib/ts/OnlinePreviewGenerator';
import { LocalTransactionWriter, LocalProjectWriter, LocalProjectLoader } from 'shared/Tracer/lib/ts/LocalTransaction';
import { Guid } from 'guid-typescript';

@Component({
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.sass']
})
export class SandboxComponent implements OnInit {
  public projectId: string = Guid.create().toString();

  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;

  codeRecorder: MonacoRecorder;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj = new ApiHttpRequest(this.requestInfo);
  previewPath: string = null;
  previewBaseUrl: string = null;

  constructor(private route: ActivatedRoute, private zone: NgZone) {
  }

  ngOnInit(): void {
  }

  onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    this.recordingTreeComponent.allowEdit(true);
    this.recordingEditor.AllowEdits(true);

    this.codeRecorder = new MonacoRecorder(
      this.recordingEditor,
      this.recordingTreeComponent,
      this.projectId,
      new LocalProjectLoader(),
      new LocalProjectWriter(),
      new LocalTransactionWriter(this.projectId));

    this.codeRecorder.DeleteProject(this.projectId).then(() => {
      this.codeRecorder.New().then(() => {
        this.codeRecorder.StartRecording();
      });
    });
  }

  public onCloseClicked(e: any) {
    this.previewPath = null;
  }

  public onPreviewClicked(e: string) {
    const previewGenerator = new OnlinePreviewGenerator(this.requestObj);
    const previewPos = Math.round(this.codeRecorder.position);
    previewGenerator.GeneratePreview(previewPos, this.codeRecorder.logs).then((url) => {
      if (!url) {
        console.error(`preview url failed to be retrieved`);
        return;
      }
      this.zone.runTask(() => {
        this.previewBaseUrl = url;
        this.previewPath = e;
      });
    });
  }
}