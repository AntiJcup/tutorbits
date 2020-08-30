import { IPreviewCommunicationService } from '../abstract/IPreviewCommunicationService';
import droopyPostMessage from 'droopy-postmessage';

export class TutorBitsPreviewCommunicationService extends IPreviewCommunicationService {
  /* Make sure to call disconnect after as this can leak */
  public async Connect(previewIframe: HTMLIFrameElement): Promise<void> {
    droopyPostMessage.subscribe('pmsg', this.onPreviewMessage);
  }


  public Disconnect(): void {
    droopyPostMessage._turnOff();
  }


  protected onPreviewMessage(e: Event, msg: any) {

  }
}
