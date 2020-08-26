import { BaseEditorPlugin } from './../../../../shared/language-server/src/client/base-editor-plugin';

export abstract class IEditorPluginService {
  public abstract getPlugin(pluginId: string): BaseEditorPlugin;
  public abstract getPlugins(): BaseEditorPlugin[];
  public async abstract registerPlugins(): Promise<void>;
}
