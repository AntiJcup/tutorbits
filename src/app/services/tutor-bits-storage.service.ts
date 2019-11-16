import { Injectable } from '@angular/core';
import { IStorageService } from './abstract/IStorageService';

@Injectable()
export class TutorBitsStorageService extends IStorageService {
  constructor() { super(); }

  public GetItem(key: string): any {
    return JSON.parse(localStorage[key]);
  }

  public SetItem(key: string, item: any): void {
    localStorage[key] = JSON.stringify(item);
  }

  public DeleteItem(key: string): void {
    delete localStorage[key];
  }

  public CheckExists(key: string): boolean {
    return typeof (localStorage[key]) !== undefined;
  }
}
