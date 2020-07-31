import { Output, EventEmitter, OnDestroy, Directive } from '@angular/core';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from 'monaco-languageclient/lib/monaco-converter';
import { RespondingWebSocket } from 'shared/web/lib/ts/RespondingWebSocket';
import * as normalizeUrl from 'normalize-url';
import { Guid } from 'guid-typescript';
import { CompletionItemKind, SymbolKind, CompletionItem } from 'monaco-languageclient/lib/services';

export interface GoToDefinitionEvent {
  path: string;
  offset: monaco.Position;
}

// TODO MOVE THIS SHIT
const PYTHON_LANGUAGE_ID = 'python';

export enum CommandType {
  Arguments,
  Completions,
  Hover,
  Usages,
  Definitions,
  Symbols
}

const commandNames = new Map<CommandType, string>();
commandNames.set(CommandType.Arguments, 'arguments');
commandNames.set(CommandType.Completions, 'completions');
commandNames.set(CommandType.Definitions, 'definitions');
commandNames.set(CommandType.Hover, 'tooltip');
commandNames.set(CommandType.Usages, 'usages');
commandNames.set(CommandType.Symbols, 'names');

// tslint:disable-next-line:no-unused-variable
export interface ICommand {
  id: string;
  telemetryEvent?: string;
  command: CommandType;
  source?: string;
  fileName: string;
  lineIndex: number;
  columnIndex: number;
}

export interface IResponse {
  id: string;
  result: any;
}

export interface IAutoCompleteItem {
  type: CompletionItemKind;
  rawType: CompletionItemKind;
  kind: SymbolKind;
  text: string;
  description: string;
  raw_docstring: string;
  rightLabel: string;
}

export interface ICompletionResult {
  items: IAutoCompleteItem[];
}

const pythonVSCodeTypeMappings = new Map<string, CompletionItemKind>();
pythonVSCodeTypeMappings.set('none', CompletionItemKind.Value);
pythonVSCodeTypeMappings.set('type', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('tuple', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('dict', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('dictionary', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('function', CompletionItemKind.Function);
pythonVSCodeTypeMappings.set('lambda', CompletionItemKind.Function);
pythonVSCodeTypeMappings.set('generator', CompletionItemKind.Function);
pythonVSCodeTypeMappings.set('class', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('instance', CompletionItemKind.Reference);
pythonVSCodeTypeMappings.set('method', CompletionItemKind.Method);
pythonVSCodeTypeMappings.set('builtin', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('builtinfunction', CompletionItemKind.Function);
pythonVSCodeTypeMappings.set('module', CompletionItemKind.Module);
pythonVSCodeTypeMappings.set('file', CompletionItemKind.File);
pythonVSCodeTypeMappings.set('xrange', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('slice', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('traceback', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('frame', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('buffer', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('dictproxy', CompletionItemKind.Class);
pythonVSCodeTypeMappings.set('funcdef', CompletionItemKind.Function);
pythonVSCodeTypeMappings.set('property', CompletionItemKind.Property);
pythonVSCodeTypeMappings.set('import', CompletionItemKind.Module);
pythonVSCodeTypeMappings.set('keyword', CompletionItemKind.Keyword);
pythonVSCodeTypeMappings.set('constant', CompletionItemKind.Variable);
pythonVSCodeTypeMappings.set('variable', CompletionItemKind.Variable);
pythonVSCodeTypeMappings.set('value', CompletionItemKind.Value);
pythonVSCodeTypeMappings.set('param', CompletionItemKind.Variable);
pythonVSCodeTypeMappings.set('statement', CompletionItemKind.Keyword);

const pythonVSCodeSymbolMappings = new Map<string, SymbolKind>();
pythonVSCodeSymbolMappings.set('none', SymbolKind.Variable);
pythonVSCodeSymbolMappings.set('type', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('tuple', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('dict', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('dictionary', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('function', SymbolKind.Function);
pythonVSCodeSymbolMappings.set('lambda', SymbolKind.Function);
pythonVSCodeSymbolMappings.set('generator', SymbolKind.Function);
pythonVSCodeSymbolMappings.set('class', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('instance', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('method', SymbolKind.Method);
pythonVSCodeSymbolMappings.set('builtin', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('builtinfunction', SymbolKind.Function);
pythonVSCodeSymbolMappings.set('module', SymbolKind.Module);
pythonVSCodeSymbolMappings.set('file', SymbolKind.File);
pythonVSCodeSymbolMappings.set('xrange', SymbolKind.Array);
pythonVSCodeSymbolMappings.set('slice', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('traceback', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('frame', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('buffer', SymbolKind.Array);
pythonVSCodeSymbolMappings.set('dictproxy', SymbolKind.Class);
pythonVSCodeSymbolMappings.set('funcdef', SymbolKind.Function);
pythonVSCodeSymbolMappings.set('property', SymbolKind.Property);
pythonVSCodeSymbolMappings.set('import', SymbolKind.Module);
pythonVSCodeSymbolMappings.set('keyword', SymbolKind.Variable);
pythonVSCodeSymbolMappings.set('constant', SymbolKind.Constant);
pythonVSCodeSymbolMappings.set('variable', SymbolKind.Variable);
pythonVSCodeSymbolMappings.set('value', SymbolKind.Variable);
pythonVSCodeSymbolMappings.set('param', SymbolKind.Variable);
pythonVSCodeSymbolMappings.set('statement', SymbolKind.Variable);
pythonVSCodeSymbolMappings.set('boolean', SymbolKind.Boolean);
pythonVSCodeSymbolMappings.set('int', SymbolKind.Number);
pythonVSCodeSymbolMappings.set('longlean', SymbolKind.Number);
pythonVSCodeSymbolMappings.set('float', SymbolKind.Number);
pythonVSCodeSymbolMappings.set('complex', SymbolKind.Number);
pythonVSCodeSymbolMappings.set('string', SymbolKind.String);
pythonVSCodeSymbolMappings.set('unicode', SymbolKind.String);
pythonVSCodeSymbolMappings.set('list', SymbolKind.Array);

function getMappedVSCodeType(pythonType: string): CompletionItemKind {
  if (pythonVSCodeTypeMappings.has(pythonType)) {
    const value = pythonVSCodeTypeMappings.get(pythonType);
    if (value) {
      return value;
    }
  }
  return CompletionItemKind.Keyword;
}

function getMappedVSCodeSymbol(pythonType: string): SymbolKind {
  if (pythonVSCodeSymbolMappings.has(pythonType)) {
    const value = pythonVSCodeSymbolMappings.get(pythonType);
    if (value) {
      return value;
    }
  }
  return SymbolKind.Variable;
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
  private filePath: string;
  private ignoreNext = false;
  public visible = false;

  private m2p = new MonacoToProtocolConverter();
  private p2m = new ProtocolToMonacoConverter();

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

    this.setupPython();
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

  public UpdateModelForFile(path: string, model: monaco.editor.ITextModel) {
    this.logServer.LogToConsole('MonacoEditor', `UpdateCacheForCurrentFile: ${path}`);
    this.fileEditors[path] = model;
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
    }
  }

  public GenerateNewEditorModel(path: string, data: string = ''): monaco.editor.ITextModel {
    this.logServer.LogToConsole('editor', `Generating new model: ${path}`);
    return monaco.editor.createModel(data, this.GetLanguageByPath(path), monaco.Uri.file(path));
  }

  private createUrl(path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeUrl(`${protocol}://${location.host}${location.pathname}${path}`);
  }

  private createWebSocket(url: string): RespondingWebSocket<IResponse, 'id'> {
    const socketOptions = {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 10000,
      maxRetries: Infinity,
      debug: false
    };
    return new RespondingWebSocket('id', url, [], socketOptions);
  }


  private setupPython() {
    const url = this.createUrl('/');
    const webSocket = this.createWebSocket(url);

    webSocket.onopen = () => {
      monaco.languages.register({
        id: PYTHON_LANGUAGE_ID,
        extensions: ['.py'],
        aliases: [PYTHON_LANGUAGE_ID],
        mimetypes: ['application/python'],
      });

      monaco.languages.registerCompletionItemProvider(PYTHON_LANGUAGE_ID, {
        async provideCompletionItems(model, position, context, token): Promise<monaco.languages.CompletionList> {
          const type = CommandType.Completions;
          const columnIndex = position.column;

          const source = model.getValue();
          const cmd: ICommand = {
            id: Guid.create().toString(), // todo generate in  a more common spot
            command: type,
            fileName: model.uri.toString(),
            columnIndex,
            lineIndex: position.lineNumber,
            source
          };

          const payload = {
            id: Guid.create(), // todo generate in  a more common spot
            prefix: '',
            lookup: commandNames.get(cmd.command),
            path: cmd.fileName,
            source: cmd.source,
            line: cmd.lineIndex,
            column: cmd.columnIndex,
            config: this.getConfig()
          };

          webSocket.send(JSON.stringify(cmd));
          const response = await webSocket.listenForResponse(cmd.id);
          let results = response.result as IAutoCompleteItem[];

          results = Array.isArray(results) ? results : [];
          results.forEach((item) => {
            // tslint:disable-next-line:no-any
            const originalType = (item.type as any) as string;
            item.type = getMappedVSCodeType(originalType);
            item.kind = getMappedVSCodeSymbol(originalType);
            item.rawType = getMappedVSCodeType(originalType);
          });
          const completionResult: ICompletionResult = {
            items: results
          };

          return {
            suggestions: completionResult.items.map((item) => {
              const completionItem: monaco.languages.CompletionItem = {
                label: item.text,
                kind: item.type,
                range: null,
                insertText: null
              };

              if (item.kind === SymbolKind.Function || item.kind === SymbolKind.Method) {
                completionItem.insertText = `${item.text}()`;
              }

              return completionItem;
            })
          } as monaco.languages.CompletionList;
        },

        resolveCompletionItem(model, position, item, token):
          monaco.languages.CompletionItem | monaco.Thenable<monaco.languages.CompletionItem> {
          // return jsonService.doResolve(m2p.asCompletionItem(item)).then(result => p2m.asCompletionItem(result, item.range));
          return null as monaco.languages.CompletionItem;
        }
      });
    };
  }
}
