import { Injectable } from '@angular/core';
import { IEventService } from './abstract/IEventService';

@Injectable()
export class TutorBitsGAEventService extends IEventService {
  constructor() {
    super();
  }

  public TriggerPageView(url: string): void {
    (window as any).ga('set', 'page', url);
    (window as any).ga('send', 'pageview');
  }

  public TriggerError(component: string, error: string): void {
    (window as any).ga('send', 'event', {
      eventCategory: `Error`, eventAction: error, eventLabel: component
    });
  }

  public TriggerButtonClick(component: string, buttonName: string) {
    (window as any).ga('send', 'event', {
      eventCategory: `ButtonClick`, eventAction: buttonName, eventLabel: component
    });
  }
}
