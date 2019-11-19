import { Output, EventEmitter, OnDestroy } from '@angular/core';
import { editor } from 'monaco-editor';
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
    this.codeEditor.layout({ width: window.innerWidth - 410, height: window.innerHeight });
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

    monaco.editor.setModelLanguage(this.codeEditor.getModel(), this.GetLanguageByPath(this.filePath));

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
    this.logServer.LogToConsole('MonacoEditor', `CacheVersion: ${this.fileCache[this.filePath]}`);

    return this.GetCacheForFileName(this.filePath);
  }

  public GetCacheForFileName(path: string) {
    return this.fileCache[path];
  }

  public abstract Show(show: boolean);

  public AllowEdits(edit: boolean) {
    this.codeEditor.updateOptions(edit ? MonacoEditorComponent.editOptions : MonacoEditorComponent.readOnlyOptions);
    const editorModel = this.codeEditor.getModel() as editor.ITextModel;
    editorModel.pushEOL(monaco.editor.EndOfLineSequence.CRLF);
  }

  public GetLanguageByPath(path: string) {
    if (path.endsWith('.js')) {
      return 'javascript';
    } else if (path.endsWith('.html')) {
      return 'html';
    } else if (path.endsWith('.css')) {
      return 'css';
    }
  }
}
