import ReconnectingWebSocket, { UrlProvider, Options } from 'reconnecting-websocket';

// Assumes event data is a json string
// tslint:disable-next-line: max-line-length
export class RespondingWebSocket<TResponseMessageInterface, ResponseIdField extends keyof TResponseMessageInterface> extends ReconnectingWebSocket {
  private responseCallback: (event: MessageEvent) => void = null;
  private expectedResponses: Map<TResponseMessageInterface[ResponseIdField], (TResponseMessageInterface) => void> =
    new Map<TResponseMessageInterface[ResponseIdField], (TResponseMessageInterface) => void>();

  constructor(private idField: ResponseIdField, url: UrlProvider, protocols?: string | string[], options?: Options) {
    super(url, protocols, options);
  }

  private setupListener() {
    if (this.responseCallback) {
      return;
    }

    this.responseCallback = (event) => { this.onResponse(event); };
    this.addEventListener('message', this.responseCallback);
  }

  private async onResponse(event: MessageEvent) {
    if (this.expectedResponses.size <= 0) {
      return;
    }

    const eventDataText = typeof (event.data) === 'string' ? event.data : await (event.data as Blob).text();
    const parsedData = JSON.parse(eventDataText) as TResponseMessageInterface;
    let matchedId: TResponseMessageInterface[ResponseIdField];
    for (const expectedId of this.expectedResponses.keys()) {
      const id = parsedData[this.idField];
      if (id !== expectedId) {
        continue;
      }

      matchedId = expectedId;
    }

    if (!matchedId) {
      return;
    }

    const response = this.expectedResponses.get(matchedId);
    this.expectedResponses.delete(matchedId);
    setTimeout(() => response(parsedData), 0);
  }

  public async listenForResponse(expectedValue: TResponseMessageInterface[ResponseIdField], timeoutMS: number = 60000)
    : Promise<TResponseMessageInterface> {
    this.setupListener();

    let responseFinishCallback: (TResponseMessageInterface) => void;
    let responseFailCallback: (reason: string) => void;
    // tslint:disable-next-line: no-shadowed-variable
    const response = new Promise<TResponseMessageInterface>((resolve, reject) => {
      responseFinishCallback = resolve;
      responseFailCallback = reject;
    });

    this.expectedResponses.set(expectedValue, responseFinishCallback);
    setTimeout(() => {
      if (!this.expectedResponses.has(expectedValue)) {
        return; // No time out if it has been resolved
      }
      responseFailCallback('timeout');
    }, timeoutMS);

    return response;
  }

  public dispose() {
    if (this.responseCallback) {
      this.removeEventListener('message', this.responseCallback);
    }
  }
}
