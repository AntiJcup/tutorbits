import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ILogService } from './abstract/ILogService';

@Injectable()
export class TutorBitsLoggingService extends ILogService {

  constructor() { super(); }

  public LogToConsole(component: string, ...args: any[]): void {
    if (!environment.loggingEnabled) {
      return;
    }

    console.log.apply(console, [`LS: ${component} - `].concat(args));

    if (!environment.loggingTraceEnabled) {
      return;
    }
    // tslint:disable-next-line: no-console
    console.trace();
  }

  public LogErrorToConsole(component: string, ...args: any[]): void {
    console.error.apply(console, [`LSError: ${component} - `].concat(args));
  }
}
