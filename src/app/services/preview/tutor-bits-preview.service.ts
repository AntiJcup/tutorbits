import { Injectable } from '@angular/core';
import { IPreviewService, PreviewEvents } from '../abstract/IPreviewService';
import { IRequestService } from '../abstract/IRequestService';
import { TraceTransactionLogs, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { Guid } from 'guid-typescript';
import { IErrorService } from '../abstract/IErrorService';
import { ICodeService } from '../abstract/ICodeService';
import { IEditorPluginService } from '../abstract/IEditorPluginService';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Injectable()
export class TutorBitsPreviewService extends IPreviewService {
  // tslint:disable-next-line: variable-name
  private visible_ = false;
  // tslint:disable-next-line: variable-name
  private loading_ = false;
  // tslint:disable-next-line: variable-name
  private fullUrl_: SafeUrl;
  private currentPreviewUrl: string;
  private currentPreviewPath: string;
  private loadingId: string;

  public get visible(): boolean {
    return this.visible_;
  }

  public get loading(): boolean {
    return this.loading_;
  }

  public get previewUrl(): string {
    return this.currentPreviewUrl;
  }

  public get previewPath(): string {
    return this.currentPreviewPath;
  }

  public set previewPath(p: string) {
    this.currentPreviewPath = p;
    this.fullUrl_ = this.constructFullUrl(this.currentPreviewUrl, p);
  }

  public get fullUrl(): SafeUrl {
    return this.fullUrl_;
  }

  constructor(
    protected requestService: IRequestService,
    protected errorService: IErrorService,
    protected codeService: ICodeService,
    protected editorPluginService: IEditorPluginService,
    private sanitizer: DomSanitizer) {
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
      this.loading_ = true;
      this.loadingId = Guid.create().toString();
      const loadingRef = this.loadingId;
      if ((logs && logs.length > 0) || baseProjectId) {
        url = await this.GeneratePreview(projectId, offset, logs || [], baseProjectId);
      } else {
        url = await this.LoadPreview(projectId, offset);
      }

      // Was cancelled or another preview started loading
      if (!this.loading || this.loadingId !== loadingRef) {
        return;
      }

      this.currentPreviewUrl = url;
      this.currentPreviewPath = path;
      this.previewPath = path;
      this.visible_ = true;
      this.emit(PreviewEvents[PreviewEvents.RequestShow], projectId, offset, url, path);
    } catch (err) {
      this.errorService.HandleError('PreviewError', err);
    }
    this.loading_ = false;
  }

  public async HidePreview(): Promise<void> {
    this.currentPreviewUrl = null;
    this.currentPreviewPath = null;
    this.visible_ = false;
    this.emit(PreviewEvents[PreviewEvents.RequestHide]);
  }

  protected constructFullUrl(url: string, path: string): SafeUrl {
    const fileUrl = `${url}${path}`;

    let urlPath = path;
    const extensionType = path.split('.').pop();
    const sourceUrl = encodeURIComponent(fileUrl);

    const language = this.codeService.GetLanguageByPath(path);
    const languageServerUrl = this.editorPluginService.getPlugin(language)?.serverUrl;

    switch (extensionType) {
      case 'js':
      case 'py':
        urlPath = `/preview-helpers/${extensionType}/preview.html?base=${encodeURIComponent(url)}&target=${encodeURIComponent(path)}`;
        break;
    }

    if (languageServerUrl) {
      urlPath += `&server=${encodeURIComponent(languageServerUrl)}`;
    }

    const furl = this.sanitizer.bypassSecurityTrustResourceUrl(`${url}${urlPath}`);
    return furl;
  }
}
