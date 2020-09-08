import { BaseWorkspacePlugin } from 'shared/language-client/client/base-workspace-plugin';

export abstract class IWorkspacePluginService {
  public abstract getPlugin(pluginId: string): BaseWorkspacePlugin;
  public abstract getPlugins(): BaseWorkspacePlugin[];
  public async abstract setupNewWorkspace(projectType: string): Promise<void>;
}
