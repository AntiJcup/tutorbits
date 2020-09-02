import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { EventEmitter } from '@angular/core';

export enum PreviewEvents {
  Show,
  Hide,
  Loaded,
}

export abstract class IPreviewService extends EventEmitter {
  public abstract async LoadPreview(
    projectId: string,
    offsetEnd: number): Promise<string>;

  public abstract async GeneratePreview(
    projectId: string,
    offsetEnd: number,
    logs: TraceTransactionLog[],
    baseProject?: string): Promise<string>;

  public abstract async DownloadPreview(
    projectId: string,
    offsetEnd: number,
    logs: TraceTransactionLog[],
    baseProject?: string): Promise<void>;

  public abstract async ShowPreview(
    projectId: string,
    offset: number,
    path: string,
    logs: TraceTransactionLog[],
    baseProjectId?: string): Promise<void>;
  public abstract async HidePreview(): Promise<void>;
}
