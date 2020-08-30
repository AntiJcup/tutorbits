import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MonacoEditorComponent } from '../../editors/editor/monaco-editor.component';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';
import { ICodeService } from 'src/app/services/abstract/ICodeService';

@Component({
  selector: 'app-recording-editor',
  templateUrl: './recording-editor.component.html',
  styleUrls: ['./recording-editor.component.sass']
})

export class RecordingEditorComponent extends MonacoEditorComponent implements OnInit {
  constructor(logServer: ILogService, editorPluginService: IEditorPluginService, codeService: ICodeService) {
    super(logServer, editorPluginService, codeService);
  }

  ngOnInit() {
    if (!this.codeService.currentFilePath || this.codeService.currentFilePath === '') {
      this.Show(false);
    }
  }
}
