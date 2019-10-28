import { Component, OnInit, Input } from '@angular/core';
import { editor } from 'monaco-editor';
import { OnlineTransactionRequest, OnlineTransactionRequestInfo, OnlineTransactionWriter, OnlineProjectLoader, OnlineProjectWriter } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { MonacoRecorder } from '../recorder/monaco.recorder';
import { TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';

@Component({
  selector: 'app-recording-editor',
  templateUrl: './recording-editor.component.html',
  styleUrls: ['./recording-editor.component.sass']
})

export class RecordingEditorComponent implements OnInit {
  editorOptions = { theme: 'vs-dark', language: 'javascript' };
  startingCode = '';

  codeEditor: editor.ICodeEditor;
  codeRecorder: MonacoRecorder;

  @Input() projectId: string;
  @Input() requestInfo: OnlineTransactionRequestInfo;

  constructor() { }

  public get CodeRecorder(): MonacoRecorder {
    return this.codeRecorder;
  }

  ngOnInit() {
  }

  editorOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor as editor.ICodeEditor;

    const requestObj = new OnlineTransactionRequest(this.requestInfo);
    this.codeRecorder = new MonacoRecorder(this.codeEditor,
      this.projectId,
      new OnlineProjectLoader(requestObj),
      new OnlineProjectWriter(requestObj),
      new OnlineTransactionWriter(requestObj,
        this.projectId));

    this.codeRecorder.DeleteProject(this.projectId).then(() => {
      this.codeRecorder.New().then(() => {
        this.codeRecorder.StartRecording();
      });
    });
  }

}
