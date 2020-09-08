import { CompletionItemKind, SymbolKind } from "monaco-languageclient/lib/services";

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

export interface IHoverResult {
    items: IHoverItem[];
}

export interface IHoverItem {
    kind: SymbolKind;
    text: string;
    description: string;
    docstring: string;
    signature: string;
    raw_docstring?: string;
}

export interface IDefinitionResult {
    definitions: IDefinition[];
}

export interface IDefinitionRange {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
export interface IDefinition {
    rawType: string;
    type: CompletionItemKind;
    kind: SymbolKind;
    text: string;
    fileName: string;
    container: string;
    range: IDefinitionRange;
}

export interface ITextRange {
    readonly start: number;
    readonly end: number;
    readonly length: number;
    contains(position: number): boolean;
}

export interface ITextRangeCollection<T> extends ITextRange {
    count: number;
    getItemAt(index: number): T;
    getItemAtPosition(position: number): number;
    getItemContaining(position: number): number;
}

export interface IArgumentsResult {
    definitions: ISignature[];
}

export interface ISignature {
    name: string;
    docstring: string;
    description: string;
    paramindex: number;
    params: IArgument[];
}

export interface IArgument {
    name: string;
    value: string;
    docstring: string;
    description: string;
}

export interface ISyntaxErrorRange {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
}
