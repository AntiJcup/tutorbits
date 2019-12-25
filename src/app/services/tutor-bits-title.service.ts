import { Injectable } from '@angular/core';
import { ITitleService } from './abstract/ITitleService';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class TutorBitsTitleService extends ITitleService {
  private title: string;
  private titleObs: BehaviorSubject<string> = new BehaviorSubject<string>(this.title);
  
  constructor() { super(); }

  public GetTitleObs(): BehaviorSubject<string> {
    return this.titleObs;
  }

  public SetTitle(title: string): void {
    this.title = title;
    this.titleObs.next(this.title);
  }
}