import { IWorkspacePluginService } from '../abstract/IWorkspacePluginService';
import { ICodeService } from '../abstract/ICodeService';
import { PythonWorkspacePlugin } from 'shared/language-client/client/projects/Python/python-workspace-plugin';
import { WebsiteWorkspacePlugin } from 'shared/language-client/client/projects/Website/website-workspace-plugin';
import { BaseWorkspacePlugin } from 'shared/language-client/client/base-workspace-plugin';
import { Injectable } from '@angular/core';
import { IFileTreeService } from '../abstract/IFileTreeService';
import { IRecorderService } from '../abstract/IRecorderService';

@Injectable()
export class TutorBitsWorkspacePluginService extends IWorkspacePluginService {
  private plugins: { [pluginId: string]: BaseWorkspacePlugin } = {};

  constructor(
    protected codeService: ICodeService,
    protected fileTreeService: IFileTreeService,
    protected recorderService: IRecorderService) {
    super();

    const pythonPlugin = new PythonWorkspacePlugin();
    const websitePlugin = new WebsiteWorkspacePlugin();
    this.plugins[pythonPlugin.projectType] = pythonPlugin;
    this.plugins[websitePlugin.projectType] = websitePlugin;
  }

  public getPlugin(pluginId: string): BaseWorkspacePlugin | undefined {
    return this.plugins[pluginId];
  }

  public getPlugins(): BaseWorkspacePlugin[] {
    return Object.values(this.plugins);
  }

  public async setupNewWorkspace(projectType: string): Promise<void> {
    this.getPlugins().forEach(async (plugin: BaseWorkspacePlugin) => {
      if (plugin.projectType !== projectType) {
        return;
      }
      const workspace = await plugin.setupWorkspace();
      this.fileTreeService.PropogateTreeJson(workspace, {});
      this.codeService.PropogateEditor(workspace);
    });
  }
}
