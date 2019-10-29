import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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

  public codeEditor: editor.ICodeEditor;

  @Output() codeInitialized = new EventEmitter<RecordingEditorComponent>();

  constructor() { }

  ngOnInit() {
  }

  editorOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor as editor.ICodeEditor;
    this.codeInitialized.emit(this);
  }

}
