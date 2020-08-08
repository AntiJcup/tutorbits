import { Output, EventEmitter, OnDestroy, Directive } from '@angular/core';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from 'monaco-languageclient/lib/monaco-converter';
import { RespondingWebSocket } from 'shared/web/lib/ts/RespondingWebSocket';
import { RestTextConverter } from 'shared/web/lib/ts/restTextConverter';
import * as normalizeUrl from 'normalize-url';
import { CompletionItemKind, SymbolKind, WorkspaceEdit, TextEdit, Position, Range, EOL, SymbolInformation, Definition, Location, DocumentUri } from 'monaco-languageclient/lib/services';
import { Diff, diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch';


export interface GoToDefinitionEvent {
  path: string;
  offset: monaco.Position;
}

// TODO MOVE THIS SHIT
const PYTHON_LANGUAGE_ID = 'python';
const NEW_LINE_LENGTH = EOL.length;

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
  line: number;
  column: number;
}

export interface IResponse {
  id: string;
  results: any;
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

enum EditAction {
  Delete,
  Insert,
  Replace
}

class Patch {
  public diffs!: Diff[];
  public start1!: number;
  public start2!: number;
  public length1!: number;
  public length2!: number;
}

class Edit {
  public action: EditAction;
  public start: Position;
  public end!: Position;
  public text: string;

  constructor(action: number, start: Position) {
    this.action = action;
    this.start = start;
    this.text = '';
  }

  public apply(): TextEdit {
    switch (this.action) {
      case EditAction.Insert:
        return TextEdit.insert(this.start, this.text);
      case EditAction.Delete:
        return TextEdit.del(Range.create(this.start, this.end));
      case EditAction.Replace:
        return TextEdit.replace(Range.create(this.start, this.end), this.text);
      default:
        return {
          range: Range.create(0, 0, 0, 0),
          newText: ''
        } as TextEdit;
    }
  }
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
    return normalizeUrl(`ws://localhost:8999`);
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

  getTextEditsFromPatch(before: string, patch: string): TextEdit[] {
    if (patch.startsWith('---')) {
      // Strip the first two lines
      patch = patch.substring(patch.indexOf('@@'));
    }
    if (patch.length === 0) {
      return [];
    }
    // Remove the text added by unified_diff
    // # Work around missing newline (http://bugs.python.org/issue2142).
    patch = patch.replace(/\\ No newline at end of file[\r\n]/, '');
    const d = new diff_match_patch();
    const patches = this.patch_fromText(patch);
    if (!Array.isArray(patches) || patches.length === 0) {
      throw new Error('Unable to parse Patch string');
    }
    const textEdits: TextEdit[] = [];

    // Add line feeds and build the text edits
    patches.forEach((p) => {
      p.diffs.forEach((diff) => {
        diff[1] += this.codeEditor.getModel().getEOL();
      });
      this.getTextEditsInternal(before, p.diffs, p.start1).forEach((edit) => textEdits.push(edit.apply()));
    });

    return textEdits;
  }

  patch_fromText(textline: string): Patch[] {
    const patches: Patch[] = [];
    if (!textline) {
      return patches;
    }
    // Start Modification by Don Jayamanne 24/06/2016 Support for CRLF
    const text = textline.split(/[\r\n]/);
    // End Modification
    let textPointer = 0;
    const patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
    while (textPointer < text.length) {
      const m = text[textPointer].match(patchHeader);
      if (!m) {
        throw new Error(`Invalid patch string: ${text[textPointer]}`);
      }
      // tslint:disable-next-line:no-any
      const patch = new (diff_match_patch as any).patch_obj();
      patches.push(patch);
      patch.start1 = parseInt(m[1], 10);
      if (m[2] === '') {
        patch.start1 -= 1;
        patch.length1 = 1;
      } else if (m[2] === '0') {
        patch.length1 = 0;
      } else {
        patch.start1 -= 1;
        patch.length1 = parseInt(m[2], 10);
      }

      patch.start2 = parseInt(m[3], 10);
      if (m[4] === '') {
        patch.start2 -= 1;
        patch.length2 = 1;
      } else if (m[4] === '0') {
        patch.length2 = 0;
      } else {
        patch.start2 -= 1;
        patch.length2 = parseInt(m[4], 10);
      }
      textPointer += 1;

      while (textPointer < text.length) {
        const sign = text[textPointer].charAt(0);
        let line: string;
        try {
          // var line = decodeURI(text[textPointer].substring(1));
          // For some reason the patch generated by python files don't encode any characters
          // And this patch module (code from Google) is expecting the text to be encoded!!
          // Temporary solution, disable decoding
          // Issue #188
          line = text[textPointer].substring(1);
        } catch (ex) {
          // Malformed URI sequence.
          throw new Error('Illegal escape in patch_fromText');
        }
        if (sign === '-') {
          // Deletion.
          patch.diffs.push([DIFF_DELETE, line]);
        } else if (sign === '+') {
          // Insertion.
          patch.diffs.push([DIFF_INSERT, line]);
        } else if (sign === ' ') {
          // Minor equality.
          patch.diffs.push([DIFF_EQUAL, line]);
        } else if (sign === '@') {
          // Start of next patch.
          break;
        } else if (sign === '') {
          // Blank line?  Whatever.
        } else {
          // WTF?
          throw new Error(`Invalid patch mode '${sign}' in: ${line}`);
        }
        textPointer += 1;
      }
    }
    return patches;
  }

  getTextEditsInternal(before: string, diffs: [number, string][], startLine: number = 0): Edit[] {
    let line = startLine;
    let character = 0;
    const beforeLines = before.split(/\r?\n/g);
    if (line > 0) {
      beforeLines.filter((_l, i) => i < line).forEach((l) => (character += l.length + this.codeEditor.getModel().getEOL().length));
    }
    const edits: Edit[] = [];
    let edit: Edit | null = null;
    let end: Position;

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < diffs.length; i += 1) {
      let start = { line, character } as Position;
      // Compute the line/character after the diff is applied.
      // tslint:disable-next-line:prefer-for-of
      for (let curr = 0; curr < diffs[i][1].length; curr += 1) {
        if (diffs[i][1][curr] !== '\n') {
          character += 1;
        } else {
          character = 0;
          line += 1;
        }
      }

      // tslint:disable-next-line:switch-default
      switch (diffs[i][0]) {
        case DIFF_DELETE:
          if (
            beforeLines[line - 1].length === 0 &&
            beforeLines[start.line - 1] &&
            beforeLines[start.line - 1].length === 0
          ) {
            // We're asked to delete an empty line which only contains `/\r?\n/g`. The last line is also empty.
            // Delete the `\n` from the last line instead of deleting `\n` from the current line
            // This change ensures that the last line in the file, which won't contain `\n` is deleted
            start = Position.create(start.line - 1, 0);
            end = Position.create(line - 1, 0);
          } else {
            end = Position.create(line, character);
          }
          if (edit === null) {
            edit = new Edit(EditAction.Delete, start);
          } else if (edit.action !== EditAction.Delete) {
            throw new Error('cannot format due to an internal error.');
          }
          edit.end = end;
          break;

        case DIFF_INSERT:
          if (edit === null) {
            edit = new Edit(EditAction.Insert, start);
          } else if (edit.action === EditAction.Delete) {
            edit.action = EditAction.Replace;
          }
          // insert and replace edits are all relative to the original state
          // of the document, so inserts should reset the current line/character
          // position to the start.
          line = start.line;
          character = start.character;
          edit.text += diffs[i][1];
          break;

        case DIFF_EQUAL:
          if (edit !== null) {
            edits.push(edit);
            edit = null;
          }
          break;
      }
    }

    if (edit !== null) {
      edits.push(edit);
    }


    return edits;
  }

  public getWorkspaceEditsFromPatch(originalContents: string, patch: string, uri: string): WorkspaceEdit {
    const workspaceEdit = { changes: {}, documentChanges: [] } as WorkspaceEdit;
    if (patch.startsWith('---')) {
      // Strip the first two lines
      patch = patch.substring(patch.indexOf('@@'));
    }
    if (patch.length === 0) {
      return workspaceEdit;
    }
    // Remove the text added by unified_diff
    // # Work around missing newline (http://bugs.python.org/issue2142).
    patch = patch.replace(/\\ No newline at end of file[\r\n]/, '');

    const patches = this.patch_fromText(patch);
    if (!Array.isArray(patches) || patches.length === 0) {
      throw new Error('Unable to parse Patch string');
    }

    // Add line feeds and build the text edits
    patches.forEach((p) => {
      p.diffs.forEach((diff) => {
        diff[1] += this.codeEditor.getModel().getEOL();
      });
      this.getTextEditsInternal(originalContents, p.diffs, p.start1).forEach((edit) => {
        if (!workspaceEdit.changes[uri]) {
          workspaceEdit.changes[uri] = [];
        }
        switch (edit.action) {
          case EditAction.Delete:
            workspaceEdit.changes[uri].push(TextEdit.del(Range.create(edit.start, edit.end)));
            break;
          case EditAction.Insert:
            workspaceEdit.changes[uri].push(TextEdit.insert(Position.create(edit.start.line, edit.start.character), edit.text));
            break;
          case EditAction.Replace:
            workspaceEdit.changes[uri].push(TextEdit.replace(Range.create(edit.start, edit.end), edit.text));
            break;
          default:
            break;
        }
      });
    });

    return workspaceEdit;
  }

  private getSignature(signature: string, kind: SymbolKind, currentWord: string): string {
    switch (kind) {
      case SymbolKind.Constructor:
      case SymbolKind.Function:
      case SymbolKind.Method: {
        signature = `def ${signature}`;
        break;
      }
      case SymbolKind.Class: {
        signature = `class ${signature}`;
        break;
      }
      case SymbolKind.Module: {
        if (signature.length > 0) {
          signature = `module ${signature}`;
        }
        break;
      }
      default: {
        // signature = typeof item.text === 'string' && item.text.length > 0 ? item.text : currentWord;
      }
    }
    return signature;
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
          const column = position.column;

          const source = model.getValue();
          // .replace(/\r\n/g, '\n'); // "#%%\nprint('hello')\n\nt = \"lol\"\nprint(t)\n\nprint(\"noice\")\npr";

          const cmd: any = {
            id: Math.floor((Math.random() * 10000)),
            type: 'completion',
            prefix: '',
            lookup: commandNames.get(type),
            path: '',
            column: column - 1,
            line: position.lineNumber - 1,
            source,
            config: {
              extraPaths: [],
              useSnippets: false,
              caseInsensitiveCompletion: true,
              showDescriptions: true,
              fuzzyMatcher: true
            }
          };

          webSocket.send(JSON.stringify(cmd));
          const response = await webSocket.listenForResponse(cmd.id);
          let results = response.results as IAutoCompleteItem[];

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
              } else {
                completionItem.insertText = `${item.text}`;
              }

              return completionItem;
            })
          } as monaco.languages.CompletionList;
        },

        async resolveCompletionItem(model, position, item, token):
          Promise<monaco.languages.CompletionItem> {
          // return jsonService.doResolve(m2p.asCompletionItem(item)).then(result => p2m.asCompletionItem(result, item.range));
          // TODO HOVER FOR COMPLETION ITEM RETRIEVES DOCUMENTATION
          return null as monaco.languages.CompletionItem;
        }
      });

      monaco.languages.registerDocumentRangeFormattingEditProvider(PYTHON_LANGUAGE_ID, {
        provideDocumentRangeFormattingEdits: async (model, range, options, token): Promise<monaco.languages.TextEdit[]> => {
          const source = model.getValue();
          const cmd: any = {
            id: Math.floor((Math.random() * 10000)),
            type: 'format',
            source,
            range
          };

          webSocket.send(JSON.stringify(cmd));
          const response = await webSocket.listenForResponse(cmd.id);
          const results = response.results;

          const edits = this.getTextEditsFromPatch(model.getValue(), results);
          return this.p2m.asTextEdits(edits);
        }
      });

      monaco.languages.registerDocumentSymbolProvider(PYTHON_LANGUAGE_ID, {
        provideDocumentSymbols: async (model, token): Promise<monaco.languages.DocumentSymbol[]> => {
          const type = CommandType.Symbols;
          const source = model.getValue();
          // .replace(/\r\n/g, '\n'); // "#%%\nprint('hello')\n\nt = \"lol\"\nprint(t)\n\nprint(\"noice\")\npr";

          const cmd: any = {
            id: Math.floor((Math.random() * 10000)),
            type: 'names',
            lookup: commandNames.get(type),
            prefix: '',
            sourcePath: 'C:\\Users\\Jacob\\Documents\\GitHub\\vscode-python\\data\\temp.py',
            source,
            column: 0,
            line: 0,
            config: {
              extraPaths: [],
              useSnippets: false,
              caseInsensitiveCompletion: true,
              showDescriptions: true,
              fuzzyMatcher: true
            }
          };

          webSocket.send(JSON.stringify(cmd));
          const response = await webSocket.listenForResponse(cmd.id);
          console.log(response.results);
          // TODO parse results (Currently returning something I dont expect)
          return this.p2m.asSymbolInformations(response.results as SymbolInformation[]);
        }
      });

      monaco.languages.registerHoverProvider(PYTHON_LANGUAGE_ID, {
        provideHover: async (model, position, token): Promise<monaco.languages.Hover> => {
          const type = CommandType.Hover;
          const source = model.getValue();
          const word = model.getWordAtPosition(position);
          const cmd: any = {
            id: Math.floor((Math.random() * 10000)),
            type: 'tooltip',
            prefix: '',
            sourcePath: 'C:\\Users\\Jacob\\Documents\\GitHub\\vscode-python\\data\\temp.py',
            lookup: commandNames.get(type),
            source,
            column: position.column - 1,
            line: position.lineNumber - 1,
            config: {
              extraPaths: [
                'c:\\Users\\Jacob\\Documents\\GitHub\\vscode-python\\data',
                '.'
              ],
              useSnippets: false,
              caseInsensitiveCompletion: true,
              showDescriptions: true,
              fuzzyMatcher: true
            }
          };

          webSocket.send(JSON.stringify(cmd));
          const response = await webSocket.listenForResponse(cmd.id);
          console.log(response.results);
          response.results.forEach(element => {
            const textConverter = new RestTextConverter();
            const sig = this.getSignature(element.signature, element.kind, word.word);
            const description = textConverter.toMarkdown(element.docstring);
            element.contents = description;
          });

          return this.p2m.asHover(response.results[0]);
        }
      });

      monaco.languages.registerDefinitionProvider(PYTHON_LANGUAGE_ID, {
        provideDefinition: async (model, position, token)
          : Promise<monaco.languages.Definition | monaco.languages.LocationLink[] | monaco.languages.Location> => {
          const type = CommandType.Definitions;
          const column = position.column;

          const source = model.getValue();
          // .replace(/\r\n/g, '\n'); // "#%%\nprint('hello')\n\nt = \"lol\"\nprint(t)\n\nprint(\"noice\")\npr";

          const cmd: any = {
            id: Math.floor((Math.random() * 10000)),
            type: 'definitions',
            prefix: '',
            lookup: commandNames.get(type),
            path: '',
            sourcePath: 'C:/Users/Jacob/Documents/GitHub/vscode-python/data' + model.uri.path,
            column: column - 1,
            line: position.lineNumber - 1,
            source,
            config: {
              extraPaths: [],
              useSnippets: false,
              caseInsensitiveCompletion: true,
              showDescriptions: true,
              fuzzyMatcher: true
            }
          };

          const word = model.getWordAtPosition(position).word;
          webSocket.send(JSON.stringify(cmd));
          const response = await webSocket.listenForResponse(cmd.id);
          console.log(response.results);

          const definitions = response.results.filter((d) => d.text === word);
          const definition = definitions.length > 0 ? definitions[0] : response.results[response.results.length - 1];
          const definitionResource = definition.fileName;
          const range = Range.create(
            definition.range.start_line,
            definition.range.start_column,
            definition.range.end_line,
            definition.range.end_column
          );
          return this.p2m.asLocation(Location.create((definitionResource.replace('C:\\Users\\Jacob\\Documents\\GitHub\\vscode-python\\data', '')).replace(/\\/g, '/') as DocumentUri, range));
        }
      });
    };
  }
}
