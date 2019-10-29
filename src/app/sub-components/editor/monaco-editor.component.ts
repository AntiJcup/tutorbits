import { Output, EventEmitter } from '@angular/core';
import { editor } from 'monaco-editor';

export abstract class MonacoEditorComponent {
  public editorOptions = { theme: 'vs-dark', language: 'javascript' };
  public startingCode = '';
  protected fileCache: { [fileName: string]: string } = {};
  private filePath: string;

  public codeEditor: editor.ICodeEditor;

  @Output() codeInitialized = new EventEmitter<MonacoEditorComponent>();

  constructor() { }

  editorOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor as editor.ICodeEditor;
    this.codeInitialized.emit(this);
  }

  public get currentFilePath() {
    return this.filePath;
  }

  public set currentFilePath(path: string) {
    this.filePath = path;

    // Switch contents based on file name
    const cache = this.GetCacheForCurrentFile();
    if (!cache) {
      this.codeEditor.setValue('');
      return;
    }
    this.codeEditor.setValue(cache);
  }

  public UpdateCacheForCurrentFile(): void {
    const textModel = this.codeEditor.getModel() as editor.ITextModel;
    const clone = textModel.getValue();
    this.fileCache[this.filePath] = clone;
  }

  public GetCacheForCurrentFile(): string {
    console.log(`CacheVersion: ${this.fileCache[this.filePath]}`);
    return this.fileCache[this.filePath];
  }
}
