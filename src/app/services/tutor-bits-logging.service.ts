import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ILogService } from './abstract/ILogService';

@Injectable()
export class TutorBitsLoggingService extends ILogService {

  constructor() { super(); }

  public LogToConsole(...args: any[]): void {
    if (!environment.loggingEnabled) {
      return;
    }

    console.log.apply(console, [`LS: `].concat(args));

    if (!environment.loggingTraceEnabled) {
      return;
    }
    // tslint:disable-next-line: no-console
    console.trace();
  }
}
