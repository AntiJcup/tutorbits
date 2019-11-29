import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Component({
  selector: 'app-recording-editor',
  templateUrl: './recording-editor.component.html',
  styleUrls: ['./recording-editor.component.sass']
})

export class RecordingEditorComponent extends MonacoEditorComponent implements OnInit {
  constructor(logServer: ILogService) {
    super(logServer);
  }

  ngOnInit() {
    if (!this.currentFilePath || this.currentFilePath === '') {
      this.Show(false);
    }
  }
}
