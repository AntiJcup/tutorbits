import { Component, OnInit, Input } from '@angular/core';
import { editor } from 'monaco-editor';
import { MonacoPlayer } from '../player/monaco.player';
import { OnlineTransactionLoader, OnlineTransactionRequest, OnlineTransactionRequestInfo, OnlineProjectLoader } from 'shared/Tracer/lib/ts/OnlineTransaction';

@Component({
  selector: 'app-playback-editor',
  templateUrl: './playback-editor.component.html',
  styleUrls: ['./playback-editor.component.sass']
})

export class PlaybackEditorComponent implements OnInit {
  editorOptions = { theme: 'vs-dark', language: 'javascript' };
  startingCode = '';

  codeEditor: editor.ICodeEditor;
  codePlayer: MonacoPlayer;

  @Input() projectId: string;
  @Input() requestInfo: OnlineTransactionRequestInfo;

  constructor() { }

  public get CodePlayer(): MonacoPlayer {
    return this.codePlayer;
  }

  ngOnInit() {
  }

  editorOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor as editor.ICodeEditor;

    const requestObj: OnlineTransactionRequest = new OnlineTransactionRequest(this.requestInfo);
    this.codePlayer = new MonacoPlayer(
      this.codeEditor,
      new OnlineProjectLoader(requestObj),
      new OnlineTransactionLoader(requestObj),
      this.projectId);

    this.codePlayer.Load().then(() => {
      this.codePlayer.Play();
    });
  }

}
