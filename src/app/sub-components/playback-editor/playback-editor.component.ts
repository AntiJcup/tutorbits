import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Component({
  selector: 'app-playback-editor',
  templateUrl: './playback-editor.component.html',
  styleUrls: ['./playback-editor.component.sass']
})

export class PlaybackEditorComponent extends MonacoEditorComponent implements OnInit {
  @ViewChild('codeeditorcontainer', { static: true }) componentContainer: ElementRef;
  @ViewChild('codeeditortitle', { static: true }) editorTitle: ElementRef;

  constructor(logServer: ILogService) {
    super(logServer);
  }

  ngOnInit() {
    if (!this.currentFilePath || this.currentFilePath === '') {
      this.Show(false);
    }
  }

  public Show(show: boolean) {
    if (show) {
      this.componentContainer.nativeElement.style.visibility = 'visible';
      this.editorTitle.nativeElement.innerText = this.currentFilePath;
    } else {
      this.componentContainer.nativeElement.style.visibility = 'hidden';
    }
  }

}
