import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MonacoEditorComponent } from '../editor/monaco-editor.component';

@Component({
  selector: 'app-recording-editor',
  templateUrl: './recording-editor.component.html',
  styleUrls: ['./recording-editor.component.sass']
})

export class RecordingEditorComponent extends MonacoEditorComponent implements OnInit {
  ngOnInit() {
  }
}
