import { Component, OnInit } from '@angular/core';
import { MonacoEditorComponent } from '../../editors/editor/monaco-editor.component';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';
import { ICodeService } from 'src/app/services/abstract/ICodeService';
import { IFileTreeService } from 'src/app/services/abstract/IFileTreeService';

@Component({
  selector: 'app-recording-editor',
  templateUrl: './recording-editor.component.html',
  styleUrls: ['./recording-editor.component.sass']
})

export class RecordingEditorComponent extends MonacoEditorComponent implements OnInit {
  constructor(
    logService: ILogService,
    editorPluginService: IEditorPluginService,
    codeService: ICodeService,
    fileTreeService: IFileTreeService) {
    super(logService, editorPluginService, codeService, fileTreeService);
  }

  ngOnInit() {
    if (!this.codeService.currentFilePath || this.codeService.currentFilePath === '') {
      this.Show(false);
    }
  }
}
