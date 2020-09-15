import { IEditorPluginService } from '../abstract/IEditorPluginService';
import { BaseEditorPlugin } from 'shared/language-client/client/base-editor-plugin';
import { PythonEditorPlugin } from 'shared/language-client/client/languages/python/python-editor-plugin';
import { ICodeService } from '../abstract/ICodeService';

export class TutorBitsEditorPluginService extends IEditorPluginService {
  private plugins: { [pluginId: string]: BaseEditorPlugin } = {};

  constructor() {
    super();
  }

  public getPlugin(pluginId: string): BaseEditorPlugin | undefined {
    return this.plugins[pluginId];
  }

  public getPlugins(): BaseEditorPlugin[] {
    return Object.values(this.plugins);
  }

  public async registerPlugins(codeService: ICodeService): Promise<void> {
    const pythonPlugin = new PythonEditorPlugin(codeService);
    this.plugins[pythonPlugin.language] = pythonPlugin;

    this.getPlugins().forEach(async (plugin: BaseEditorPlugin) => {
      await plugin.register();
    });
  }

  public isSupportedCodeFile(path: string): boolean {
    const extension = `.${path.split('.').pop()}`;
    let supported = false;

    switch (extension) {
      case '.js': // Built in support
        return true;
      default:
        this.getPlugins().forEach((plugin: BaseEditorPlugin) => {
          supported = supported || plugin.isExtensionSupported(extension);
        });
    }

    return supported;
  }

  public getLanguageOfCodeFile(path: string): string {
    const extension = `.${path.split('.').pop()}`;
    let language = '';

    switch (extension) {
      case 'js':
        return 'javascript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        this.getPlugins().forEach((plugin: BaseEditorPlugin) => {
          language = language.length > 0 ? language : (plugin.isExtensionSupported(extension) ? plugin.language : '');
        });
    }

    return language;
  }

  public dispose(): void {
    this.getPlugins().forEach((plugin: BaseEditorPlugin) => {
      plugin.dispose();
    });

    this.plugins = {};
  }
}
