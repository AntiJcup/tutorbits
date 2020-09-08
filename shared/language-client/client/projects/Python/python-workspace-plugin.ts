import { BaseWorkspacePlugin } from '../../base-workspace-plugin';
import { SupportedWorkspaces } from '../../../../language-server/src/shared/plugin-types';

export class PythonWorkspacePlugin extends BaseWorkspacePlugin {
  public get projectType(): string {
    return SupportedWorkspaces[SupportedWorkspaces.Python];
  }

  public async setupWorkspace(): Promise<{ [path: string]: string }> {
    return { '/project/main.py': 'print("hello world!")' };
  }
}
