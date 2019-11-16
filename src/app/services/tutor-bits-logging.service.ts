import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ILogService } from './interfaces/ILogService';

export class TutorBitsLoggingService implements ILogService {

  constructor() { }

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
