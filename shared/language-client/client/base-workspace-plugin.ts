export abstract class BaseWorkspacePlugin {
  public abstract get projectType(): string;

  //#region WorkspaceSetupHelpers
  public async setupWorkspace(): Promise<{ [path: string]: string }> {
    return {};
  }
  //#endregion WorkspaceSetupHelpers
}
