import { Injectable } from '@angular/core';
import { IPreviewService, PreviewEvents } from '../abstract/IPreviewService';
import { IRequestService } from '../abstract/IRequestService';
import { TraceTransactionLogs, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { Guid } from 'guid-typescript';
import { IErrorService } from '../abstract/IErrorService';

@Injectable()
export class TutorBitsPreviewService extends IPreviewService {
  private internalVisible = false;
  private internalLoading = false;
  private currentPreviewUrl: string;
  private currentPreviewPath: string;
  private internalLoadingId: string;

  public visible(): boolean {
    return this.internalVisible;
  }

  public loading(): boolean {
    return this.internalLoading;
  }

  public get previewUrl(): string {
    return this.currentPreviewUrl;
  }

  public get previewPath(): string {
    return this.currentPreviewPath;
  }

  public set previewPath(p: string) {
    this.currentPreviewPath = p;
  }

  constructor(
    protected requestService: IRequestService,
    protected errorService: IErrorService) {
    super();
  }

  public async LoadPreview(projectId: string, offsetEnd: number): Promise<string> {
    const response = await this.requestService
      .Get(`api/project/preview/load?projectId=${projectId}&offsetEnd=${offsetEnd}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  public async GeneratePreview(
    projectId: string,
    offsetEnd: number,
    logs: TraceTransactionLog[],
    baseProjectId?: string): Promise<string> {
    const uploadLogs: TraceTransactionLogs = new TraceTransactionLogs();
    uploadLogs.setLogsList(logs);
    const buffer = uploadLogs.serializeBinary();
    const response = await this.requestService
      .Post(`api/project/preview/generate?projectId=${projectId}&offsetEnd=${offsetEnd}${baseProjectId ? `&baseProjectId=${baseProjectId}` : ''}`,
        new Blob([buffer]));

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  public async DownloadPreview(
    projectId: string,
    offsetEnd: number,
    logs: TraceTransactionLog[],
    baseProjectId?: string): Promise<void> {
    const uploadLogs: TraceTransactionLogs = new TraceTransactionLogs();
    uploadLogs.setLogsList(logs);
    const buffer = uploadLogs.serializeBinary();
    const response = await this.requestService
      // tslint:disable-next-line: max-line-length
      .Post(`api/project/preview/download?projectId=${projectId}&offsetEnd=${offsetEnd}${baseProjectId ? `&baseProjectId=${baseProjectId}` : ''}`,
        new Blob([buffer]));

    if (!response.ok) {
      throw new Error('Failed generating download url for preview');
    }

    const downloadUrl = await response.json();
    if (!downloadUrl) {
      throw new Error('Bad download url for preview');
    }

    const downloadFrame = document.createElement('iframe');
    downloadFrame.style.display = 'none';
    downloadFrame.src = downloadUrl;
    document.body.appendChild(downloadFrame);
  }

  public async ShowPreview(
    projectId: string,
    offset: number,
    path: string,
    logs?: TraceTransactionLog[],
    baseProjectId?: string
  ): Promise<void> {
    let url = '';
    try {
      this.internalLoading = true;
      this.internalLoadingId = Guid.create().toString();
      const loadingRef = this.internalLoadingId;
      if (logs || baseProjectId) {
        url = await this.GeneratePreview(projectId, offset, logs || [], baseProjectId);
      } else {
        url = await this.LoadPreview(projectId, offset);
      }

      // Was cancelled or another preview started loading
      if (!this.loading || this.internalLoadingId !== loadingRef) {
        return;
      }

      this.currentPreviewUrl = url;
      this.currentPreviewPath = path;
      this.internalVisible = true;
      this.emit(PreviewEvents[PreviewEvents.RequestShow], projectId, offset, url, path);
    } catch (err) {
      this.errorService.HandleError('PreviewError', err);
    }
    this.internalLoading = false;
  }

  public async HidePreview(): Promise<void> {
    this.currentPreviewUrl = null;
    this.currentPreviewPath = null;
    this.internalVisible = false;
    this.emit(PreviewEvents[PreviewEvents.RequestHide]);
  }
}
