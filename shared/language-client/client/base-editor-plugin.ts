import {
  CompletionItemKind,
  SymbolKind,
  Range,
  SymbolInformation,
  Location,
  DocumentUri,
  CompletionItem,
  InsertTextFormat,
  Hover,
  MarkupContent,
  MarkupKind,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
} from 'monaco-languageclient/lib/services';
import { ProtocolToMonacoConverter } from 'monaco-languageclient/lib/monaco-converter';
import { LanguageServerClient, LanguageCommandType } from 'shared/language-server/src/shared/language-server-client';
import { TargetType, ClientUpdateSource } from 'shared/language-server/src/shared/types';
import { EditParser } from './editor-edit';
import { RestTextConverter } from './rest-text-converter';
import { TokenizerMode, IToken, Tokenizer, TokenType } from './tokenizer';
import './extensions';
import { ISyntaxErrorRange, IAutoCompleteItem, ICompletionResult, IDefinition, IHoverItem, ISignature } from './types';
import { ITextRangeCollection } from './textRangeCollection';
import { FormatResponse } from 'shared/language-server/src/shared/plugin-types';

// TODO move this into python plugin
const DOCSTRING_PARAM_PATTERNS = [
  '\\s*:type\\s*PARAMNAME:\\s*([^\\n, ]+)', // Sphinx
  '\\s*:param\\s*(\\w?)\\s*PARAMNAME:[^\\n]+', // Sphinx param with type
  '\\s*@type\\s*PARAMNAME:\\s*([^\\n, ]+)' // Epydoc
];

export abstract class BaseEditorPlugin implements
  monaco.languages.CompletionItemProvider,
  monaco.languages.DocumentRangeFormattingEditProvider,
  monaco.languages.DocumentSymbolProvider,
  monaco.languages.HoverProvider,
  monaco.languages.DefinitionProvider,
  monaco.languages.SignatureHelpProvider {

  readonly displayName?: string = 'Editor';
  public abstract get triggerCharacters(): string[] | undefined;
  public abstract get language(): string;
  public abstract get extensions(): string[];
  public abstract get mimeTypes(): string[];
  public abstract get helpTriggerCharacters(): string[];
  public abstract get typeMappings(): Map<string, CompletionItemKind>;
  public abstract get symbolMappings(): Map<string, SymbolKind>;
  public abstract get paramPatterns(): string[];
  public abstract get serverUrl(): string;

  private disposables: monaco.IDisposable[] = [];
  private p2m = new ProtocolToMonacoConverter();

  protected connection: LanguageServerClient | undefined;

  constructor() {
  }
  signatureHelpTriggerCharacters?: readonly string[] | undefined;
  signatureHelpRetriggerCharacters?: readonly string[] | undefined;


  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.disposables = [];
  }

  public async register() {
    this.connection = new LanguageServerClient(this.serverUrl);

    monaco.languages.register({
      id: this.language,
      extensions: this.extensions,
      aliases: [this.language],
      mimetypes: this.mimeTypes,
    });

    this.signatureHelpTriggerCharacters = this.helpTriggerCharacters;
    this.signatureHelpRetriggerCharacters = this.helpTriggerCharacters;

    this.disposables.push(monaco.languages.registerCompletionItemProvider(this.language, this));
    this.disposables.push(monaco.languages.registerDocumentRangeFormattingEditProvider(this.language, this));
    this.disposables.push(monaco.languages.registerDocumentSymbolProvider(this.language, this));
    this.disposables.push(monaco.languages.registerHoverProvider(this.language, this));
    this.disposables.push(monaco.languages.registerDefinitionProvider(this.language, this));
    this.disposables.push(monaco.languages.registerSignatureHelpProvider(this.language, this));
  }

  //#region LanguageInterfaces
  public async validateEditor(e: monaco.editor.IModelContentChangedEvent, model: monaco.editor.ITextModel) {
    const source = model.getValue();
    const path = model.uri.path;
    const sourceUpdate = {
      updatedSourceCode: source,
      updatedSourcePath: path
    } as ClientUpdateSource;
    const cmd = this.connection?.generateLanguageCommand(LanguageCommandType.syntax, model.uri.path);
    const response = await this.connection?.sendRequest(TargetType.language, cmd, sourceUpdate);
    const syntaxErrors = response.results as ISyntaxErrorRange[];
    const markers = syntaxErrors.map(error => {
      return {
        severity: monaco.MarkerSeverity.Error,
        message: 'Syntax Error',
        startLineNumber: error.startLine,
        startColumn: error.startColumn,
        endLineNumber: error.endLine,
        endColumn: error.endColumn,
      } as monaco.editor.IMarkerData;
    });
    monaco.editor.setModelMarkers(model, 'default', markers);
  }

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken): Promise<monaco.languages.CompletionList> {

    const source = model.getValue();
    const path = model.uri.path;
    const sourceUpdate = {
      updatedSourceCode: source,
      updatedSourcePath: path
    } as ClientUpdateSource;
    const wordUntil = model.getWordUntilPosition(position);
    const defaultRange = new monaco.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);

    const cmd = this.connection?.generateLanguageCommand(LanguageCommandType.completion, model.uri.path, position);
    const response = await this.connection?.sendRequest(TargetType.language, cmd, sourceUpdate);
    const results = response.results as IAutoCompleteItem[];

    results.forEach((item) => {
      // tslint:disable-next-line:no-any
      const originalType = (item.type as any) as string;
      item.type = this.getMappedVSCodeType(originalType);
      item.kind = this.getMappedVSCodeSymbol(originalType);
      item.rawType = this.getMappedVSCodeType(originalType);
    });
    const completionResult: ICompletionResult = {
      items: results
    };

    return {
      suggestions: completionResult.items.map((item) => {
        const completionItem: CompletionItem = {
          label: item.text,
          kind: item.type,
          insertText: item.text,
          insertTextFormat: InsertTextFormat.Snippet
        };

        if (item.kind === SymbolKind.Function || item.kind === SymbolKind.Method) {
          completionItem.insertText = `${item.text}($1)`;
        } else {
          completionItem.insertText = `${item.text}`;
        }

        // tslint:disable-next-line: max-line-length
        completionItem.sortText = ((completionItem.label as string).startsWith('__') ? 'z' : (completionItem.label as string).startsWith('_') ? 'y' : '__') +
          completionItem.label;

        return this.p2m.asCompletionItem(completionItem, defaultRange);
      })
    } as monaco.languages.CompletionList;
  }

  async resolveCompletionItem(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    item: monaco.languages.CompletionItem,
    token: monaco.CancellationToken): Promise<monaco.languages.CompletionItem> {
    // TODO IMPLEMENTATION
    console.warn('resolveCompletionItem - NOT IMPLEMENTED');
    return item;
  }

  async provideDocumentRangeFormattingEdits(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken): Promise<monaco.languages.TextEdit[]> {
    const source = model.getValue();
    const path = model.uri.path;
    const sourceUpdate = {
      updatedSourceCode: source,
      updatedSourcePath: path
    } as ClientUpdateSource;
    const cmd = this.connection?.generateFormatCommand(model.uri.path, range);
    const response = await this.connection?.sendRequest(TargetType.format, cmd, sourceUpdate);
    const results = response.results as FormatResponse;

    const editParser = new EditParser(model);
    const edits = editParser.getTextEditsFromPatch(model.getValue(), results.diff);
    return this.p2m.asTextEdits(edits);
  }

  async provideDocumentSymbols(
    model: monaco.editor.ITextModel,
    token: monaco.CancellationToken): Promise<monaco.languages.DocumentSymbol[]> {
    const source = model.getValue();
    const path = model.uri.path;
    const sourceUpdate = {
      updatedSourceCode: source,
      updatedSourcePath: path
    } as ClientUpdateSource;

    const cmd = this.connection?.generateLanguageCommand(LanguageCommandType.names, model.uri.path);
    const response = await this.connection?.sendRequest(TargetType.language, cmd, sourceUpdate);
    const results = response.results as SymbolInformation[];

    // TODO parse results (Currently returning something I dont expect)
    return this.p2m.asSymbolInformations(results);
  }

  async provideHover(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken): Promise<monaco.languages.Hover> {
    const source = model.getValue();
    const path = model.uri.path;
    const sourceUpdate = {
      updatedSourceCode: source,
      updatedSourcePath: path
    } as ClientUpdateSource;
    const wordAtPos = model.getWordAtPosition(position);
    if (!wordAtPos) {
      this.p2m.asHover(null);
    }
    const word = wordAtPos.word;
    const cmd = this.connection?.generateLanguageCommand(LanguageCommandType.tooltip, model.uri.path, position);
    const response = await this.connection?.sendRequest(TargetType.language, cmd, sourceUpdate);
    const result = response.results as IHoverItem[];

    return this.p2m.asHover(result.map((item: IHoverItem): Hover => {
      const textConverter = new RestTextConverter();
      const signature = this.getSignature(item.signature, item.kind, word);
      let tooltip = '';
      const lines = item.docstring.split(/\r?\n/);

      // If the docstring starts with the signature, then remove those lines from the docstring.
      // if (lines.length > 0 && item.signature.indexOf(lines[0]) === 0) {
      //   lines.shift();
      //   const endIndex = lines.findIndex((line) => item.signature.endsWith(line));
      //   if (endIndex >= 0) {
      //     lines = lines.filter((_, index) => index > endIndex);
      //   }
      // }
      // if (
      //   lines.length > 0 &&
      //   word.length > 0 &&
      //   item.signature.startsWith(word) &&
      //   lines[0].startsWith(word) &&
      //   lines[0].endsWith(')')
      // ) {
      //   lines.shift();
      // }
      lines.shift();
      lines.shift();
      lines.shift();

      if (signature.length > 0) {
        tooltip = ['```python', signature, '```', '', ''].join(model.getEOL());
      }
      const rawDescription = lines.join(model.getEOL() + model.getEOL());
      const description = textConverter.toMarkdown(rawDescription);

      const header = this.p2m.asMarkdownString({
        language: 'python',
        value: signature
      });

      const contents = {
        kind: MarkupKind.Markdown,
        value: `${header.value}${model.getEOL()}${model.getEOL()}${model.getEOL()}${rawDescription}`
      } as MarkupContent;

      return {
        contents
      } as Hover;
    })[0]);
  }

  async provideDefinition(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken): Promise<monaco.languages.Definition | monaco.languages.LocationLink[] | monaco.languages.Location> {
    const source = model.getValue();
    const path = model.uri.path;
    const sourceUpdate = {
      updatedSourceCode: source,
      updatedSourcePath: path
    } as ClientUpdateSource;

    const word = model.getWordAtPosition(position).word;
    const cmd = this.connection?.generateLanguageCommand(LanguageCommandType.definitions, model.uri.path, position);
    const response = await this.connection?.sendRequest(TargetType.language, cmd, sourceUpdate);
    const result = response.results as IDefinition[];

    if (result.length === 0) {
      return this.p2m.asLocation(null);
    }

    const definitions = result.filter((d) => d.text === word);
    const definition = definitions.length > 0 ? definitions[0] : response.results[response.results.length - 1];
    const definitionResource = definition.fileName;
    const range = Range.create(
      definition.range.start_line,
      definition.range.start_column,
      definition.range.end_line,
      definition.range.end_column
    );
    return this.p2m.asLocation(Location.create((definitionResource).replace(/\\/g, '/') as DocumentUri, range));
  }

  async provideSignatureHelp(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
    context: monaco.languages.SignatureHelpContext): Promise<monaco.languages.SignatureHelpResult | null> {
    if (position.column <= 0 ||
      this.isPositionInsideStringOrComment(model, position)) {
      return null;
    }

    const source = model.getValue();
    const path = model.uri.path;
    const sourceUpdate = {
      updatedSourceCode: source,
      updatedSourcePath: path
    } as ClientUpdateSource;
    const cmd = this.connection?.generateLanguageCommand(LanguageCommandType.arguments, model.uri.path, position);
    const response = await this.connection?.sendRequest(TargetType.language, cmd, sourceUpdate);
    const result = response.results as ISignature[];


    if (result && Array.isArray(result) && result.length > 0) {
      const signature = {
        signatures: [],
        activeParameter: 0,
        activeSignature: 0
      } as SignatureHelp;

      result.forEach((def) => {
        signature.activeParameter = def.paramindex;
        // Don't display the documentation, as vs code doesn't format the documentation.
        // i.e. line feeds are not respected, long content is stripped.

        // Some functions do not come with parameter docs
        let label: string;
        let documentation: string;
        const validParamInfo =
          def.params && def.params.length > 0 && def.docstring && def.docstring.startsWith(`${def.name}(`);

        if (validParamInfo) {
          const docLines = def.docstring.splitLines();
          label = docLines.shift().trim();
          documentation = docLines.join(model.getEOL()).trim();
        } else {
          if (def.params && def.params.length > 0) {
            label = `${def.name}(${def.params.map((p) => p.name).join(', ')})`;
            documentation = def.docstring;
          } else {
            label = def.description;
            documentation = def.docstring;
          }
        }

        // tslint:disable-next-line:no-object-literal-type-assertion
        const sig = {
          label,
          documentation,
          parameters: []
        } as SignatureInformation;

        if (def.params && def.params.length) {
          sig.parameters = def.params.map((arg) => {
            if (arg.docstring.length === 0) {
              arg.docstring = this.extractParamDocString(arg.name, def.docstring);
            }
            // tslint:disable-next-line:no-object-literal-type-assertion
            return {
              documentation: arg.docstring.length > 0 ? arg.docstring : arg.description,
              label: arg.name.trim()
            } as ParameterInformation;
          });
        }
        signature.signatures.push(sig);
      });
      return this.p2m.asSignatureHelpResult(signature);
    }


    return this.p2m.asSignatureHelpResult({
      signatures: [],
      activeParameter: 0,
      activeSignature: 0
    } as SignatureHelp);
  }
  //#endregion LanguageInterfaces

  //#region CompletionUtilities
  protected getMappedVSCodeType(type: string): CompletionItemKind {
    if (this.typeMappings.has(type)) {
      const value = this.typeMappings.get(type);
      if (value) {
        return value;
      }
    }
    return CompletionItemKind.Keyword;
  }

  protected getMappedVSCodeSymbol(type: string): SymbolKind {
    if (this.symbolMappings.has(type)) {
      const value = this.symbolMappings.get(type);
      if (value) {
        return value;
      }
    }
    return SymbolKind.Variable;
  }
  //#endregion CompletionUtilities

  //#region HoverUtilities
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
  //#endregion HoverUtilities

  //#region TextUtilities
  extractParamDocString(paramName: string, docString: string): string {
    let paramDocString = '';
    // In docstring the '*' is escaped with a backslash
    paramName = paramName.replace(new RegExp('\\*', 'g'), '\\\\\\*');

    this.paramPatterns.forEach((pattern) => {
      if (paramDocString.length > 0) {
        return;
      }
      pattern = pattern.replace('PARAMNAME', paramName);
      const regExp = new RegExp(pattern);
      const matches = regExp.exec(docString);
      if (matches && matches.length > 0) {
        paramDocString = matches[0];
        if (paramDocString.indexOf(':') >= 0) {
          paramDocString = paramDocString.substring(paramDocString.indexOf(':') + 1);
        }
        if (paramDocString.indexOf(':') >= 0) {
          paramDocString = paramDocString.substring(paramDocString.indexOf(':') + 1);
        }
      }
    });

    return paramDocString.trim();
  }

  getDocumentTokens(
    document: monaco.editor.ITextModel,
    tokenizeTo: monaco.Position,
    mode: TokenizerMode
  ): ITextRangeCollection<IToken> {
    const offset = document.getOffsetAt(tokenizeTo);
    const text = document.getValue().substr(0, offset);
    return new Tokenizer().tokenize(text, 0, text.length, mode);
  }

  isPositionInsideStringOrComment(document: monaco.editor.ITextModel, position: monaco.Position): boolean {

    const tokens = this.getDocumentTokens(document, position, TokenizerMode.CommentsAndStrings);
    const offset = document.getOffsetAt(position);
    const index = tokens.getItemContaining(offset - 1);
    if (index >= 0) {
      const token = tokens.getItemAt(index);
      return token.type === TokenType.String || token.type === TokenType.Comment;
    }
    if (offset > 0 && index >= 0) {
      // In case position is at the every end of the comment or unterminated string
      const token = tokens.getItemAt(index);
      return token.end === offset && token.type === TokenType.Comment;
    }
    return false;
  }
  //#endregion TextUtilities
}
