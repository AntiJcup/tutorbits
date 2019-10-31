import { Output, EventEmitter } from '@angular/core';
import { editor } from 'monaco-editor';

export abstract class MonacoEditorComponent {
  public editorOptions = { theme: 'vs-dark', language: 'javascript' };
  public startingCode = '';
  protected fileCache: { [fileName: string]: string } = {};
  private filePath: string;
  private ignoreNext = false;

  public get ignoreNextEvent(): boolean {
    const res = this.ignoreNext;
    if (res) {
      this.ignoreNext = false;
    }
    return res;
  }

  public codeEditor: editor.ICodeEditor;

  @Output() codeInitialized = new EventEmitter<MonacoEditorComponent>();

  constructor() {
  }

  editorOnInit(codeEditor: editor.IEditor) {
    this.codeEditor = codeEditor as editor.ICodeEditor;
    if (!this.filePath || this.filePath === '') {
      this.Show(false);
    }
    this.codeInitialized.emit(this);
  }

  public get currentFilePath() {
    return this.filePath;
  }

  public set currentFilePath(path: string) {
    if (this.filePath === path) {
      return;
    }

    this.filePath = path;

    if (!this.filePath || this.filePath === '') {
      this.Show(false);
    } else {
      this.Show(true);
    }

    // Switch contents based on file name
    const cache = this.GetCacheForCurrentFile();
    if (!cache) {
      this.ignoreNext = true;
      this.codeEditor.setValue('');
      return;
    }

    this.ignoreNext = true;
    this.codeEditor.setValue(cache);
  }

  public ClearCacheForFile(path: string) {
    delete this.fileCache[path];
  }

  public ClearCacheForFolder(path: string) {
    for (const key of Object.keys(this.fileCache)) {
      if (key.startsWith(path)) {
        delete this.fileCache[key];
      }
    }
  }

  public UpdateCacheForFile(path: string, data: string) {
    this.fileCache[path] = data;
  }

  public UpdateCacheForCurrentFile(): void {
    const textModel = this.codeEditor.getModel() as editor.ITextModel;
    const clone = textModel.getValue();
    this.fileCache[this.filePath] = clone;
  }

  public GetCacheForCurrentFile(): string {
    console.log(`CacheVersion: ${this.fileCache[this.filePath]}`);
    return this.GetCacheForFileName(this.filePath);
  }

  public GetCacheForFileName(path: string) {
    return this.fileCache[path];
  }

  public abstract Show(show: boolean);
}
