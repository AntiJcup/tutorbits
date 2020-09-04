import { ICodeService, CodeEvents, GoToDefinitionEvent } from '../abstract/ICodeService';
import { ILogService } from '../abstract/ILogService';
import { Injectable } from '@angular/core';

class CodeFile {
  constructor(public model: monaco.editor.ITextModel, public listener: monaco.IDisposable) {

  }

  public dispose() {
    this.model.dispose();
    this.listener.dispose();
  }
}

@Injectable()
export class TutorBitsCodeService extends ICodeService {
  private static editOptions: monaco.editor.IEditorOptions = {
    readOnly: false
  };
  private static readOnlyOptions: monaco.editor.IEditorOptions = {
    readOnly: true
  };

  protected codeEditor: monaco.editor.ICodeEditor;
  protected selectedFilePath: string;
  protected fileEditors: { [path: string]: CodeFile } = {};
  protected log: (...args: any[]) => void;

  private ignoreNext = false;
  private initialized = false;

  constructor(protected logServer: ILogService) {
    super();
    this.log = this.logServer.LogToConsole.bind(this.logServer, 'CodeService');
  }

  public get currentFilePath(): string {
    return this.selectedFilePath;
  }

  public set currentFilePath(path: string) {
    if (this.selectedFilePath === path) {
      return;
    }

    this.log(`currentFilePath update: ${path}`);
    this.selectedFilePath = path;

    this.emit(CodeEvents[CodeEvents.SelectedFileChanged], path);

    // Switch contents based on file name
    let cache = this.GetCacheForCurrentFile();
    if (!cache) {
      cache = this.GenerateNewEditorModel(path, '');
      this.log(`failed to find cache for: ${path}`);
    }

    this.codeEditor.setModel(cache);
    monaco.editor.setModelLanguage(this.codeEditor.getModel(), this.GetLanguageByPath(this.selectedFilePath));
  }

  public get ignoreNextEvent(): boolean {
    const res = this.ignoreNext;
    if (res) {
      this.ignoreNext = false;
    }
    return res;
  }

  public get editor(): monaco.editor.ICodeEditor {
    return this.codeEditor;
  }

  public InitializeSession(editor: monaco.editor.IEditor): void {
    if (this.initialized) {
      throw new Error('Already initialized, end previous session before continouing');
    }

    this.codeEditor = editor as monaco.editor.ICodeEditor;
    this.emit(CodeEvents[CodeEvents.InitializedSession]);

    // Hack to capture go to definition requests
    const codeEditorService = this.codeEditor._codeEditorService;
    codeEditorService.openCodeEditor = ({ resource, options }) => {
      const file = resource.path;
      const range: monaco.Range = options.selection;
      this.emit(CodeEvents[CodeEvents.GotoDefinition],
        { path: file, offset: new monaco.Position(range.startLineNumber, range.startColumn) } as GoToDefinitionEvent);
    };
  }

  /* Removes all event listeners */
  public EndSession(): void {
    this.codeEditor = null;
    this.emit(CodeEvents[CodeEvents.EndedSession]);
    this.selectedFilePath = '';

    this.ignoreNext = false;

    this.ClearFiles();

    this.initialized = false;
  }

  public Cleanup(): void {
    this.removeAllListeners();
  }

  public ClearCacheForFile(path: string): void {
    this.log(`ClearCacheForFile: ${path}`);
    if (!this.fileEditors[path]) {
      return;
    }
    this.fileEditors[path].dispose();
    delete this.fileEditors[path];
  }

  public ClearCacheForFolder(path: string): void {
    this.log(`ClearCacheForFolder: ${path}`);
    for (const key of Object.keys(this.fileEditors)) {
      if (key.startsWith(path)) {
        this.ClearCacheForFile(key);
      }
    }
  }

  public UpdateCacheForFile(filePath: string, data: string): void {
    this.log(`UpdateCacheForCurrentFile: ${filePath}`);

    if (!this.fileEditors[filePath]) {
      const fileModel = this.GenerateNewEditorModel(filePath, data);
      this.fileEditors[filePath] = new CodeFile(
        fileModel,
        fileModel.onDidChangeContent((e: monaco.editor.IModelContentChangedEvent) => {
          this.emit(CodeEvents[CodeEvents.FileContentChanged], e, fileModel);
        }));
    } else {
      this.fileEditors[filePath].model.setValue(data);
      this.emit(CodeEvents[CodeEvents.FileContentChanged], null, this.fileEditors[filePath].model);
    }
  }

  public UpdateModelForFile(filePath: string, model: monaco.editor.ITextModel): void {
    this.log(`UpdateCacheForCurrentFile: ${filePath}`);
    if (model.id === this.fileEditors[filePath]?.model?.id) {
      return;
    }
    const listener = model.onDidChangeContent(async (e: monaco.editor.IModelContentChangedEvent) => {
      this.emit(CodeEvents[CodeEvents.FileContentChanged], e, model);
    });
    if (this.fileEditors[filePath]) {
      this.fileEditors[filePath].model = model;
      this.fileEditors[filePath].listener.dispose();
      this.fileEditors[filePath].listener = listener;
    } else {
      this.fileEditors[filePath] = new CodeFile(model, listener);
    }

  }

  public UpdateCacheForCurrentFile(): void {
    this.log(`UpdateCacheForCurrentFile: ${this.selectedFilePath}`);

    const textModel = this.codeEditor.getModel();
    this.UpdateModelForFile(this.selectedFilePath, textModel);
  }

  public GetCacheForCurrentFile(): monaco.editor.ITextModel {
    return this.GetCacheForFileName(this.selectedFilePath);
  }

  public GetCacheForFileName(path: string): monaco.editor.ITextModel {
    this.log(`CacheVersion: ${this.fileEditors[path]}`);

    return this.fileEditors[path]?.model;
  }

  public AllowEdits(edit: boolean): void {
    this.codeEditor.updateOptions(edit ? TutorBitsCodeService.editOptions : TutorBitsCodeService.readOnlyOptions);
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

  public PropogateEditor(files: { [path: string]: string; }): void {
    for (const filePath of Object.keys(files)) {
      const fileData = files[filePath];
      this.UpdateCacheForFile(filePath, fileData);
    }
  }

  public GenerateNewEditorModel(path: string, data: string): monaco.editor.ITextModel {
    this.log(`Generating new model: ${path}`);
    const modelPath = monaco.Uri.file(path);
    const existing = monaco.editor.getModel(modelPath);
    if (existing) {
      return existing;
    }

    return monaco.editor.createModel(data, this.GetLanguageByPath(path), modelPath);
  }

  public ClearFiles(): void {
    for (const key of Object.keys(this.fileEditors)) {
      this.ClearCacheForFile(key);
    }

    // Just incase a model is untracked by us lets clear them too
    for (const model of monaco.editor.getModels()) {
      if (model.isDisposed()) {
        continue;
      }
      model.dispose();
    }
  }
}
