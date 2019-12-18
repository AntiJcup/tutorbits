import { Injectable } from '@angular/core';
import { IEventService } from './abstract/IEventService';
import { environment } from 'src/environments/environment';

@Injectable()
export class TutorBitsGAEventService extends IEventService {
  constructor() {
    super();
  }

  public TriggerPageView(url: string): void {
    if (!(window as any).ga) {
      return;
    }
    (window as any).ga('set', 'page', url);
    (window as any).ga('set', 'dimension1', environment.envName);
    (window as any).ga('send', 'pageview');
  }

  public TriggerError(component: string, error: string): void {
    if (!(window as any).ga) {
      return;
    }
    (window as any).ga('set', 'dimension1', environment.envName);
    (window as any).ga('send', 'event', {
      eventCategory: `Error`, eventAction: error, eventLabel: component
    });
  }

  public TriggerButtonClick(component: string, buttonName: string) {
    if (!(window as any).ga) {
      return;
    }
    (window as any).ga('set', 'dimension1', environment.envName);
    (window as any).ga('send', 'event', {
      eventCategory: `ButtonClick`, eventAction: buttonName, eventLabel: component
    });
  }
}
