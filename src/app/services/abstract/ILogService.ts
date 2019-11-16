import { InjectionToken } from '@angular/core';

export abstract class ILogService {
    public abstract LogToConsole(...args: any[]): void;
}