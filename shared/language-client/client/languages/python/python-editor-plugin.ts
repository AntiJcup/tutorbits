import { BaseEditorPlugin } from '../../base-editor-plugin';
import { SupportedLanguages } from '../../../../language-server/src/shared/plugin-types';
import { CompletionItemKind, SymbolKind } from 'monaco-languageclient/lib/services';

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

const DOCSTRING_PARAM_PATTERNS = [
  '\\s*:type\\s*PARAMNAME:\\s*([^\\n, ]+)', // Sphinx
  '\\s*:param\\s*(\\w?)\\s*PARAMNAME:[^\\n]+', // Sphinx param with type
  '\\s*@type\\s*PARAMNAME:\\s*([^\\n, ]+)' // Epydoc
];

export class PythonEditorPlugin extends BaseEditorPlugin {
  public get triggerCharacters(): string[] | undefined {
    return undefined;
  }

  public get language(): string {
    return SupportedLanguages[SupportedLanguages.python];
  }

  public get extensions(): string[] {
    return ['.py', '.pyi'];
  }

  public get mimeTypes(): string[] {
    return ['application/python'];
  }

  public get helpTriggerCharacters(): string[] {
    return ['(', ','];
  }

  public get typeMappings(): Map<string, CompletionItemKind> {
    return pythonVSCodeTypeMappings;
  }

  public get symbolMappings(): Map<string, SymbolKind> {
    return pythonVSCodeSymbolMappings;
  }

  public get paramPatterns(): string[] {
    return DOCSTRING_PARAM_PATTERNS;
  }

  public get serverUrl(): string {
    return 'ws://localhost:8999';
  }
}
