import { TargetType, Response, ResponseType } from '../../../language-server/src/shared/types';
import { ExecuteResponse, ExecuteResponseType } from '../../../language-server/src/shared/plugin-types';
import { BasePreview } from './base-preview';
import { LanguageServerClient } from '../../../language-server/src/shared/language-server-client';

export class BaseServerPreview extends BasePreview {
  private server: string;
  private connection: LanguageServerClient | undefined;

  constructor() {
    super();
    this.server = decodeURIComponent(this.urlParams.get('server'));
  }

  public async initialize(): Promise<void> {
    await super.initialize();
    await this.connectToServer();
    await this.initializeServerWorkspace();
  }

  public async start(): Promise<void> {
    await this.executeCode();
  }

  protected async connectToServer(): Promise<void> {
    console.log(`INTERNAL - Connecting To Server`);
    this.connection = new LanguageServerClient(this.server, false /*Dont initialize workspace on open we will handle it to avoid races*/);
    let serverConnectionResolve: any = null;
    const serverConnectionPromise = new Promise<void>((resolve) => {
      serverConnectionResolve = resolve;
    });

    this.connection.addEventListener('open', (async (e: Event) => {
      if (serverConnectionResolve) { //Check if already resolved
        console.log(`INTERNAL - Connected To Server`);
        serverConnectionResolve();
        serverConnectionResolve = null;
      } else {
        console.log(`INTERNAL - Reconnected To Server`);
      }
    }) as any);

    this.connection.onerror = (e: ErrorEvent) => {
      // TODO handling
      console.log(`INTERNAL - Failing Connecting To Server`);
    }

    this.connection.addEventListener('message', (async (e: MessageEvent) => {
      const response = JSON.parse(e.data) as Response;
      switch (response.type) {
        case ResponseType.Execute:
          await this.onServerExecutionResponse(response.results as ExecuteResponse);
      }

    }) as any);

    return serverConnectionPromise;
  }

  protected async initializeServerWorkspace(): Promise<void> {
    const initializeCmd = this.connection.generateInitializeWorkspaceCommand(this.sources);
    await this.connection.sendRequest(TargetType.workspace, initializeCmd);
    console.log(`INTERNAL - Finished initializing workspace`);
  }

  protected async executeCode(): Promise<void> {
    const executeCmd = this.connection.generateExecuteCommand(this.targetPath);
    await this.connection.sendRequest(TargetType.execute, executeCmd);
  }

  protected async sendServerExecuteRequest(): Promise<void> {

  }

  protected async onServerExecutionResponse(data: ExecuteResponse): Promise<void> {
    if (data.type === ExecuteResponseType.finished) {
      console.log(`INTERNAL - Completed`);
      return;
    }

    switch (data.type) {
      case ExecuteResponseType.stdout:
        console.log(`INTERNAL - Recieved Output: ${data.data}`);
        break;
      case ExecuteResponseType.stderr:
        console.log(`INTERNAL - Recieved Error: ${data.data}`);
        break;
    }
  }
}
