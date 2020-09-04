import 'ngx-monaco-editor';
import { EasyEventEmitter } from 'shared/web/lib/ts/EasyEventEmitter';

export enum CodeEvents {
  InitializedSession,
  EndedSession,
  GotoDefinition,
  SelectedFileChanged,
  FileContentChanged
}

export interface GoToDefinitionEvent {
  path: string;
  offset: monaco.Position;
}

export abstract class ICodeService extends EasyEventEmitter {
  public abstract get currentFilePath(): string;

  public abstract set currentFilePath(path: string);

  public abstract get ignoreNextEvent(): boolean;

  public abstract get editor(): monaco.editor.ICodeEditor;

  public abstract InitializeSession(editor: monaco.editor.IEditor): void;

  public abstract EndSession(): void;

  public abstract Cleanup(): void;

  public abstract ClearCacheForFile(path: string): void;

  public abstract ClearCacheForFolder(path: string): void;

  public abstract UpdateCacheForFile(filePath: string, data: string): void;

  public abstract UpdateModelForFile(filePath: string, model: monaco.editor.ITextModel): void;

  public abstract UpdateCacheForCurrentFile(): void;

  public abstract GetCacheForCurrentFile(): monaco.editor.ITextModel;

  public abstract GetCacheForFileName(path: string): monaco.editor.ITextModel;

  public abstract AllowEdits(edit: boolean): void;

  public abstract GetLanguageByPath(path: string): string;

  public abstract PropogateEditor(files: { [path: string]: string }): void;

  public abstract GenerateNewEditorModel(path: string, data: string): monaco.editor.ITextModel;

  public abstract ClearFiles(): void;
}
