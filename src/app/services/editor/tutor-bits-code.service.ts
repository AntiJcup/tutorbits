import { ICodeService, CodeEvents, GoToDefinitionEvent } from '../abstract/ICodeService';
import { ILogService } from '../abstract/ILogService';
import { Injectable } from '@angular/core';
import { IEditorPluginService } from '../abstract/IEditorPluginService';

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
  private static externalFileStarter = '$external.';

  protected codeEditor: monaco.editor.ICodeEditor;
  protected selectedFilePath: string;
  protected fileEditors: { [path: string]: CodeFile } = {};
  protected currentCache: string;
  protected log: (...args: any[]) => void;

  private ignoreNext = false;
  private initialized = false;

  constructor(
    protected logService: ILogService,
    protected editorPluginService: IEditorPluginService) {
    super();
    this.log = this.logService.LogToConsole.bind(this.logService, 'CodeService');
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
    if (!this.selectedFilePath) {
      return;
    }

    // Switch contents based on file name
    let cache = this.GetCacheForCurrentFile();
    const language = this.GetLanguageByPath(this.selectedFilePath);
    if (!cache) {
      let data = '';
      if (this.selectedFilePath.startsWith(TutorBitsCodeService.externalFileStarter)) {
        data = this.editorPluginService.getPlugin(language).externalContent;
      }
      cache = this.GenerateNewEditorModel(path, data);
      this.log(`failed to find cache for: ${path}`);
    }

    this.codeEditor.setModel(cache);
    this.currentCache = cache.getValue();
    monaco.editor.setModelLanguage(this.codeEditor.getModel(), language);
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

  public UpdateCacheForFile(filePath: string, data: string, sendEvents: boolean = true): void {
    this.log(`UpdateCacheForFile: ${filePath}`);

    if (filePath.startsWith(TutorBitsCodeService.externalFileStarter)) {
      return;
    }

    if (!this.fileEditors[filePath]) {
      const fileModel = this.GenerateNewEditorModel(filePath, data);

      this.fileEditors[filePath] = new CodeFile(
        fileModel,
        fileModel.onDidChangeContent((e: monaco.editor.IModelContentChangedEvent) => {
          this.emit(
            CodeEvents[CodeEvents.FileContentChanged],
            e,
            fileModel,
            filePath === this.selectedFilePath ? this.currentCache : fileModel.getValue(),
            filePath);
          if (filePath === this.selectedFilePath) {
            this.currentCache = fileModel.getValue();
          }
        }));
      if (data && sendEvents) {
        this.emit(
          CodeEvents[CodeEvents.FileContentChanged],
          null,
          this.fileEditors[filePath].model,
          fileModel.getValue(),
          filePath);
      }
    } else {
      if (sendEvents) {
        this.emit(
          CodeEvents[CodeEvents.FileContentChanged],
          null,
          this.fileEditors[filePath].model,
          this.fileEditors[filePath].model.getValue(),
          filePath);
      }
      if (filePath === this.selectedFilePath) {
        this.currentCache = this.fileEditors[filePath].model.getValue();
      }

      this.fileEditors[filePath].model.setValue(data);
    }
  }

  public UpdateModelForFile(filePath: string, fileModel: monaco.editor.ITextModel): void {
    this.log(`UpdateModelForFile: ${filePath}`);
    if (
      fileModel.id === this.fileEditors[filePath]?.model?.id ||
      !filePath ||
      filePath.startsWith(TutorBitsCodeService.externalFileStarter)) {
      return;
    }

    const listener = fileModel.onDidChangeContent(async (e: monaco.editor.IModelContentChangedEvent) => {
      this.emit(
        CodeEvents[CodeEvents.FileContentChanged],
        e,
        fileModel,
        filePath === this.selectedFilePath ? this.currentCache : fileModel.getValue(),
        filePath);
      if (filePath === this.selectedFilePath) {
        this.currentCache = fileModel.getValue();
      }
    });

    if (this.fileEditors[filePath]) {
      this.fileEditors[filePath].model = fileModel;
      this.fileEditors[filePath].listener.dispose();
      this.fileEditors[filePath].listener = listener;
    } else {
      this.fileEditors[filePath] = new CodeFile(fileModel, listener);
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
    return this.editorPluginService.getLanguageOfCodeFile(path);
  }

  public PropogateEditor(files: { [path: string]: string; }, sendEvents: boolean = true): void {
    for (const filePath of Object.keys(files)) {
      const fileData = files[filePath];
      this.UpdateCacheForFile(filePath, fileData, sendEvents);
    }
  }

  public GenerateNewEditorModel(path: string, data: string): monaco.editor.ITextModel {
    this.log(`Generating new model: ${path}`);
    const modelPath = monaco.Uri.file(path);
    const existing = monaco.editor.getModel(modelPath);
    if (existing) {
      if (!path.startsWith(TutorBitsCodeService.externalFileStarter)) {
        return existing;
      } else {
        existing.dispose();
      }
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

  public ExportFileSystem(): { [path: string]: string } {
    const fileSystem: { [path: string]: string } = {};
    for (const path of Object.keys(this.fileEditors)) {
      fileSystem[path] = this.fileEditors[path].model.getValue();
    }

    return fileSystem;
  }
}
