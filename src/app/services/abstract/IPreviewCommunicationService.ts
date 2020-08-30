import { EventEmitter } from 'events';

export abstract class IPreviewCommunicationService extends EventEmitter {
  public abstract async Connect(previewIframe: HTMLIFrameElement): Promise<void>;
  public abstract Disconnect(): void;
}
