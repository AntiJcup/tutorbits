import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { EventEmitter } from 'events';
import { SafeUrl } from '@angular/platform-browser';

export enum PreviewEvents {
  Generated,
  Loaded,
  Downloaded,
  RequestShow,
  RequestHide
}

export abstract class IPreviewService extends EventEmitter {
  public abstract visible(): boolean;
  public abstract loading(): boolean;
  public abstract get previewUrl(): string;

  public abstract get previewPath(): string;
  public abstract set previewPath(p: string);

  public abstract async LoadPreview(
    projectId: string,
    offsetEnd: number): Promise<string>;

  public abstract async GeneratePreview(
    projectId: string,
    offsetEnd: number,
    logs: TraceTransactionLog[],
    baseProjectId?: string): Promise<string>;

  public abstract async DownloadPreview(
    projectId: string,
    offsetEnd: number,
    logs: TraceTransactionLog[],
    baseProjectId?: string): Promise<void>;

  public abstract async ShowPreview(
    projectId: string,
    offset: number,
    path: string,
    logs?: TraceTransactionLog[],
    baseProjectId?: string): Promise<void>;

  public abstract async HidePreview(): Promise<void>;
}
