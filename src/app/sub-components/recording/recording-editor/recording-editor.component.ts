import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MonacoEditorComponent } from '../../editors/editor/monaco-editor.component';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';

@Component({
  selector: 'app-recording-editor',
  templateUrl: './recording-editor.component.html',
  styleUrls: ['./recording-editor.component.sass']
})

export class RecordingEditorComponent extends MonacoEditorComponent implements OnInit {
  constructor(logServer: ILogService, editorPluginService: IEditorPluginService) {
    super(logServer, editorPluginService);
  }

  ngOnInit() {
    if (!this.currentFilePath || this.currentFilePath === '') {
      this.Show(false);
    }
  }
}
