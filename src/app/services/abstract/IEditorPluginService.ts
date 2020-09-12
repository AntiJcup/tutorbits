import { BaseEditorPlugin } from 'shared/language-client/client/base-editor-plugin';

export abstract class IEditorPluginService {
  public abstract getPlugin(pluginId: string): BaseEditorPlugin;
  public abstract getPlugins(): BaseEditorPlugin[];
  public async abstract registerPlugins(): Promise<void>;
  public abstract isSupportedCodeFile(path: string): boolean;
  public abstract getLanguageOfCodeFile(path: string): string;
}
