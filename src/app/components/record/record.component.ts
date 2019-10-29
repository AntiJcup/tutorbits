import { Component, OnInit, ViewChild } from '@angular/core';
import { OnlineTransactionRequestInfo, OnlineTransactionRequest, OnlineProjectLoader, OnlineProjectWriter, OnlineTransactionWriter } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MonacoRecorder } from 'src/app/sub-components/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording-editor/recording-editor.component';
import { RecordingFileTreeComponent } from 'src/app/sub-components/recording-file-tree/recording-file-tree.component';

@Component({
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass']
})
export class RecordComponent implements OnInit {
  public projectId: string;

  @ViewChild(RecordingFileTreeComponent, { static: true }) recordingTreeComponent: RecordingFileTreeComponent;
  @ViewChild(RecordingEditorComponent, { static: true }) recordingEditor: RecordingEditorComponent;

  codeRecorder: MonacoRecorder;
  requestInfo: OnlineTransactionRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  constructor(private route: ActivatedRoute) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
  }

  ngOnInit(): void {
  }

  onCodeInitialized(recordingEditor: RecordingEditorComponent) {
    const requestObj = new OnlineTransactionRequest(this.requestInfo);
    this.codeRecorder = new MonacoRecorder(
      this.recordingEditor,
      this.recordingTreeComponent,
      this.projectId,
      new OnlineProjectLoader(requestObj),
      new OnlineProjectWriter(requestObj),
      new OnlineTransactionWriter(requestObj, this.projectId));

    this.codeRecorder.DeleteProject(this.projectId).then(() => {
      this.codeRecorder.New().then(() => {
        this.codeRecorder.StartRecording();
      });
    });
  }


}
