import { Output, EventEmitter, OnDestroy, Directive } from '@angular/core';
import { ILogService } from 'src/app/services/abstract/ILogService';
import 'shared/web/lib/ts/extensions';
import * as normalizeUrl from 'normalize-url';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';
export interface GoToDefinitionEvent {
  path: string;
  offset: monaco.Position;
}

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class MonacoEditorComponent implements OnDestroy {
  private static editOptions: monaco.editor.IEditorOptions = {
    readOnly: false
  };
  private static readOnlyOptions: monaco.editor.IEditorOptions = {
    readOnly: true
  };

  public editorOptions = {
    theme: 'vs-dark', language: 'javascript'
  };
  public startingCode = '';
  protected fileEditors: { [fileName: string]: monaco.editor.ITextModel } = {};
  protected fileEditorListeners: { [fileName: string]: monaco.IDisposable } = {};
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

  public codeEditor: monaco.editor.ICodeEditor;
  private windowCallback: (e: UIEvent) => any;

  @Output() codeInitialized = new EventEmitter<MonacoEditorComponent>();
  @Output() gotoDefinition = new EventEmitter<GoToDefinitionEvent>();

  constructor(protected logServer: ILogService, protected editorPluginService: IEditorPluginService) {
    this.windowCallback = (e: UIEvent) => {
      this.onWindowResize();
    };
    window.addEventListener('resize', this.windowCallback);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.windowCallback);
    for (const filePath of Object.keys(this.fileEditorListeners)) {
      this.fileEditorListeners[filePath].dispose();
    }
    this.fileEditorListeners = null;
  }

  onWindowResize() {
    this.codeEditor.layout({ width: window.innerWidth - 810, height: window.innerHeight });
  }

  clearPreviousModels() {
    for (const model of monaco.editor.getModels()) {
      if (model.isDisposed()) {
        continue;
      }
      model.dispose();
    }
  }

  editorOnInit(codeEditor: monaco.editor.IEditor) {
    this.clearPreviousModels();
    this.codeEditor = codeEditor as monaco.editor.ICodeEditor;
    if (!this.filePath || this.filePath === '') {
      this.Show(false);
    }
    this.codeInitialized.emit(this);

    // Hack to capture go to definition requests
    const codeEditorService = this.codeEditor._codeEditorService;
    codeEditorService.openCodeEditor = ({ resource, options }) => {
      const file = resource.path;
      const range: monaco.Range = options.selection;
      this.gotoDefinition.emit(
        { path: file, offset: new monaco.Position(range.startLineNumber, range.startColumn) } as GoToDefinitionEvent);
    };

    this.editorPluginService.registerPlugins().then();
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
      return;
    } else {
      this.Show(true);
    }

    // Switch contents based on file name
    let cache = this.GetCacheForCurrentFile();
    if (!cache) {
      cache = this.GenerateNewEditorModel(path, '');
      this.logServer.LogToConsole('MonacoEditor', `failed to find cache for: ${path}`);
    }

    this.codeEditor.setModel(cache);
    monaco.editor.setModelLanguage(this.codeEditor.getModel(), this.GetLanguageByPath(this.filePath));
  }

  public ClearCacheForFile(path: string) {
    this.logServer.LogToConsole('MonacoEditor', `ClearCacheForFile: ${path}`);
    if (!this.fileEditors[path]) {
      return;
    }
    this.fileEditors[path].dispose();
    delete this.fileEditors[path];
    this.fileEditorListeners[path].dispose();
    delete this.fileEditorListeners[path];
  }

  public ClearCacheForFolder(path: string) {
    this.logServer.LogToConsole('MonacoEditor', `ClearCacheForFolder: ${path}`);
    for (const key of Object.keys(this.fileEditors)) {
      if (key.startsWith(path)) {
        this.ClearCacheForFile(key);
      }
    }
  }

  public UpdateCacheForFile(filePath: string, data: string) {
    this.logServer.LogToConsole('MonacoEditor', `UpdateCacheForCurrentFile: ${filePath}`);

    if (!this.fileEditors[filePath]) {
      const fileModel = this.GenerateNewEditorModel(filePath, data);
      this.fileEditors[filePath] = fileModel;
      this.fileEditorListeners[filePath] = fileModel.onDidChangeContent(async (e: monaco.editor.IModelContentChangedEvent) => {
        // await this.ValidateEditor(e, filePath); TODO hookup plugins
      });
    } else {
      this.fileEditors[filePath].setValue(data);
    }
  }

  public UpdateModelForFile(filePath: string, model: monaco.editor.ITextModel) {
    this.logServer.LogToConsole('MonacoEditor', `UpdateCacheForCurrentFile: ${filePath}`);
    this.fileEditors[filePath] = model;
    this.fileEditorListeners[filePath]?.dispose();
    this.fileEditorListeners[filePath] = model.onDidChangeContent(async (e: monaco.editor.IModelContentChangedEvent) => {
      // await this.ValidateEditor(e, filePath); TODO hookup plugins
    });
  }

  public UpdateCacheForCurrentFile(): void {
    this.logServer.LogToConsole('MonacoEditor', `UpdateCacheForCurrentFile: ${this.filePath}`);

    const textModel = this.codeEditor.getModel();
    this.UpdateModelForFile(this.filePath, textModel);
  }

  public GetCacheForCurrentFile(): monaco.editor.ITextModel {
    return this.GetCacheForFileName(this.filePath);
  }

  public GetCacheForFileName(path: string): monaco.editor.ITextModel {
    this.logServer.LogToConsole('MonacoEditor', `CacheVersion: ${this.fileEditors[path]}`);

    return this.fileEditors[path];
  }

  public Show(show: boolean) {
    this.visible = show;
  }

  public AllowEdits(edit: boolean): void {
    this.codeEditor.updateOptions(edit ? MonacoEditorComponent.editOptions : MonacoEditorComponent.readOnlyOptions);
    const editorModel = this.codeEditor.getModel() as monaco.editor.ITextModel;
    if (!editorModel) {
      return;
    }
    editorModel.pushEOL(monaco.editor.EndOfLineSequence.CRLF);
  }

  public GetLanguageByPath(path: string): string {
    if (path.endsWith('.js')) {
      return 'javascript';
    } else if (path.endsWith('.html')) {
      return 'html';
    } else if (path.endsWith('.css')) {
      return 'css';
    } else if (path.endsWith('.cs')) {
      return 'csharp';
    } else if (path.endsWith('.py')) {
      return 'python';
    }

    return '';
  }

  public PropogateEditor(files: { [path: string]: string }): void {
    for (const filePath of Object.keys(files)) {
      const fileData = files[filePath];
      const fileModel = this.GenerateNewEditorModel(filePath, fileData);
      this.fileEditors[filePath] = fileModel;
      this.fileEditorListeners[filePath] = fileModel.onDidChangeContent(async (e: monaco.editor.IModelContentChangedEvent) => {
        // await this.ValidateEditor(e, filePath); TODO use plugins for this
      });
    }
  }

  public GenerateNewEditorModel(path: string, data: string = ''): monaco.editor.ITextModel {
    this.logServer.LogToConsole('editor', `Generating new model: ${path}`);
    return monaco.editor.createModel(data, this.GetLanguageByPath(path), monaco.Uri.file(path));
  }

  private createUrl(path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeUrl(`ws://localhost:8999`);
  }
}
