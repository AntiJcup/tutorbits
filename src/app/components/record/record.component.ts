import { Component, OnInit, ViewChild } from '@angular/core';
import { OnlineTransactionRequestInfo, OnlineTransactionRequest, OnlineProjectLoader, OnlineProjectWriter, OnlineTransactionWriter } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { TreeComponent, Ng2TreeSettings, TreeModel } from 'ng2-tree';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MonacoRecorder } from 'src/app/sub-components/recorder/monaco.recorder';
import { RecordingEditorComponent } from 'src/app/sub-components/recording-editor/recording-editor.component';

@Component({
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass']
})
export class RecordComponent implements OnInit {
  public projectId: string;

  recordingEditor: RecordingEditorComponent;
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
    this.recordingEditor = recordingEditor;
    const requestObj = new OnlineTransactionRequest(this.requestInfo);
    this.codeRecorder = new MonacoRecorder(
      this.recordingEditor.codeEditor,
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
