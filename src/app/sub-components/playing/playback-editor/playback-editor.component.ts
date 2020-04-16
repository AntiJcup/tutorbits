import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { MonacoEditorComponent } from '../../editors/editor/monaco-editor.component';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Component({
  selector: 'app-playback-editor',
  templateUrl: './playback-editor.component.html',
  styleUrls: ['./playback-editor.component.sass']
})

export class PlaybackEditorComponent extends MonacoEditorComponent implements OnInit {
  constructor(logServer: ILogService) {
    super(logServer);
  }

  ngOnInit() {
    if (!this.currentFilePath || this.currentFilePath === '') {
      this.Show(false);
    }
  }
}
