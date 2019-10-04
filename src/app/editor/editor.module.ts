import { NgModule } from '@angular/core';
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG, NgxMonacoEditorConfig } from 'ngx-monaco-editor';
import { FormsModule } from '@angular/forms';

const monacoEditorConfig: NgxMonacoEditorConfig = {
  baseUrl: './assets'
};

@NgModule({
  declarations: [],
  imports: [
    MonacoEditorModule,
    FormsModule 
  ],
  exports: [
    MonacoEditorModule,
    FormsModule 
  ],
  providers: [
    { provide: NGX_MONACO_EDITOR_CONFIG, useValue: monacoEditorConfig }
  ],
})
export class EditorModule { }
