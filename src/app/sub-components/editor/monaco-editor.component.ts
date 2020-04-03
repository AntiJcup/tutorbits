import { Output, EventEmitter, OnDestroy } from '@angular/core';
import { editor, IDisposable } from 'monaco-editor';
import { ILogService } from 'src/app/services/abstract/ILogService';

export abstract class MonacoEditorComponent implements OnDestroy {

  private static editOptions: editor.IEditorOptions = {
    readOnly: false
  };
  private static readOnlyOptions: editor.IEditorOptions = {
    readOnly: true
  };

  public editorOptions = { theme: 'vs-dark', language: 'javascript' };
  public startingCode = '';
  protected fileEditors: { [fileName: string]: editor.ITextModel } = {};
  private filePath: string;
  private ignoreNext = false;
  public visible = false;

  public get ignoreNextEvent(): boolean {
    const res = this.ignoreNext;
    if (res) {
      this.ignoreNext = false;
    }
    return res;
  }

  public codeEditor: editor.ICodeEditor;
  private windowCallback: (e: UIEvent) => any;

  @Output() codeInitialized = new EventEmitter<MonacoEditorComponent>();

  constructor(protected logServer: ILogService) {
    this.windowCallback = (e: UIEvent) => {
      this.onWindowResize();
    };
    window.addEventListener('resize', this.windowCallback);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.windowCallback);
  }

  onWindowResize() {
    this.codeEditor.layout({ width: window.innerWidth - 810, height: window.innerHeight });
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

    this.logServer.LogToConsole('MonacoEditor', `currentFilePath update: ${path}`);
    this.filePath = path;

    if (!this.filePath || this.filePath === '') {
      this.Show(false);
    } else {
      this.Show(true);
    }

    // Switch contents based on file name
    let cache = this.GetCacheForCurrentFile();
    if (!cache) {
      cache = this.GenerateNewEditorModel(path, '');
      this.logServer.LogToConsole('MonacoEditor', `failed to find cache for: ${path}`);
    }

    this.ignoreNext = true;
    this.codeEditor.setModel(cache);
    monaco.editor.setModelLanguage(this.codeEditor.getModel(), this.GetLanguageByPath(this.filePath));
  }

  public ClearCacheForFile(path: string) {
    this.logServer.LogToConsole('MonacoEditor', `ClearCacheForFile: ${path}`);
    delete this.fileEditors[path];
  }

  public ClearCacheForFolder(path: string) {
    this.logServer.LogToConsole('MonacoEditor', `ClearCacheForFolder: ${path}`);
    for (const key of Object.keys(this.fileEditors)) {
      if (key.startsWith(path)) {
        this.ClearCacheForFile(key);
      }
    }
  }

  public UpdateCacheForFile(path: string, data: string) {
    this.logServer.LogToConsole('MonacoEditor', `UpdateCacheForCurrentFile: ${path}`);

    if (!this.fileEditors[path]) {
      const fileModel = this.GenerateNewEditorModel(path, data);
      this.fileEditors[path] = fileModel;
    } else {
      this.fileEditors[path].setValue(data);
    }
  }

  public UpdateModelForFile(path: string, model: editor.ITextModel) {
    this.logServer.LogToConsole('MonacoEditor', `UpdateCacheForCurrentFile: ${path}`);
    this.fileEditors[path] = model;
  }

  public UpdateCacheForCurrentFile(): void {
    this.logServer.LogToConsole('MonacoEditor', `UpdateCacheForCurrentFile: ${this.filePath}`);

    const textModel = this.codeEditor.getModel();
    this.UpdateModelForFile(this.filePath, textModel);
  }

  public GetCacheForCurrentFile(): editor.ITextModel {
    return this.GetCacheForFileName(this.filePath);
  }

  public GetCacheForFileName(path: string): editor.ITextModel {
    this.logServer.LogToConsole('MonacoEditor', `CacheVersion: ${this.fileEditors[path]}`);

    return this.fileEditors[path];
  }

  public Show(show: boolean) {
    this.visible = show;
  }

  public AllowEdits(edit: boolean): void {
    this.codeEditor.updateOptions(edit ? MonacoEditorComponent.editOptions : MonacoEditorComponent.readOnlyOptions);
    const editorModel = this.codeEditor.getModel() as editor.ITextModel;
    editorModel.pushEOL(monaco.editor.EndOfLineSequence.CRLF);
  }

  public GetLanguageByPath(path: string): string {
    if (path.endsWith('.js')) {
      return 'javascript';
    } else if (path.endsWith('.html')) {
      return 'html';
    } else if (path.endsWith('.css')) {
      return 'css';
    }

    return '';
  }

  public PropogateEditor(files: { [path: string]: string }): void {
    for (const filePath of Object.keys(files)) {
      const fileData = files[filePath];
      const fileModel = this.GenerateNewEditorModel(filePath, fileData);
      this.fileEditors[filePath] = fileModel;
    }
  }

  public GenerateNewEditorModel(path: string, data: string = ''): editor.ITextModel {
    return monaco.editor.createModel(data, this.GetLanguageByPath(path));
  }
}
