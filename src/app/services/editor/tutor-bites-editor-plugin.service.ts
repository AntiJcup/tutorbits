import { IEditorPluginService } from '../abstract/IEditorPluginService';
import { BaseEditorPlugin } from '../../../../shared/language-server/src/client/base-editor-plugin';
import { PythonEditorPlugin } from '../../../../shared/language-server/src/client/languages/python/python-editor-plugin';

export class TutorBitsEditorPluginService extends IEditorPluginService {
  private plugins: { [pluginId: string]: BaseEditorPlugin } = {};

  constructor() {
    super();

    const pythonPlugin = new PythonEditorPlugin();
    this.plugins[pythonPlugin.language] = pythonPlugin;
  }

  public getPlugin(pluginId: string): BaseEditorPlugin | undefined {
    return this.plugins[pluginId];
  }

  public getPlugins(): BaseEditorPlugin[] {
    return Object.values(this.plugins);
  }

  public async registerPlugins(): Promise<void> {
    this.getPlugins().forEach(async (plugin: BaseEditorPlugin) => {
      await plugin.register();
    });
  }
}
