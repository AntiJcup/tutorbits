import { Component, OnInit, EventEmitter, Output, Input, NgZone } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { IPreviewService } from 'src/app/services/abstract/IPreviewService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';
import { Guid } from 'guid-typescript';
import { IEditorPluginService } from 'src/app/services/abstract/IEditorPluginService';
import { ICodeService } from 'src/app/services/abstract/ICodeService';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.sass']
})

export class PreviewComponent implements OnInit {
  @Output() closeClicked = new EventEmitter();
  @Output() initialize = new EventEmitter();

  internalPreviewBaseUrl: string;
  internalPreviewPath: string;
  internalPreviewUrl: SafeUrl;
  internalLoadingId: string;

  get previewUrl(): SafeUrl {
    return this.internalPreviewUrl;
  }

  @Input()
  set previewBaseUrl(baseUrl: string) {
    this.internalPreviewBaseUrl = baseUrl;
  }

  @Input()
  set previewPath(path: string) {
    this.internalPreviewPath = path;
    const fileUrl = `${this.internalPreviewBaseUrl}${path}`;

    let urlPath = path;
    const extensionType = path.split('.').pop();
    const sourceUrl = encodeURIComponent(fileUrl);

    const language = this.codeService.GetLanguageByPath(path);
    const languageServerUrl = this.editorPluginService.getPlugin(language)?.serverUrl;

    switch (extensionType) {
      case 'js':
      case 'py':
        urlPath = `/preview-helpers/${extensionType}/preview.html?base=${encodeURIComponent(this.internalPreviewBaseUrl)}&target=${encodeURIComponent(path)}`;
        break;
    }

    if (languageServerUrl) {
      urlPath += `&server=${encodeURIComponent(languageServerUrl)}`;
    }

    this.internalPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.internalPreviewBaseUrl}${urlPath}`);
  }

  get previewPath(): string {
    return this.internalPreviewPath;
  }

  @Input() loading = false;

  constructor(
    private sanitizer: DomSanitizer,
    private previewService: IPreviewService,
    private errorServer: IErrorService,
    private editorPluginService: IEditorPluginService,
    private codeService: ICodeService,
    private zone: NgZone) { }

  ngOnInit() {
  }

  navigate(path: string) {
    this.previewPath = path;
  }

  onCloseClicked() {
    this.closeClicked.next();
  }

  public async LoadPreview(projectId: string, offset: number, path: string): Promise<void> {
    try {
      this.loading = true;
      this.internalLoadingId = Guid.create().toString();
      const loadingRef = this.internalLoadingId;
      const url = await this.previewService.LoadPreview(projectId, offset);

      // Was cancelled or another preview started loading
      if (!this.loading || this.internalLoadingId !== loadingRef) {
        return;
      }

      this.ShowPreview(url, path);
    } catch (err) {
      this.errorServer.HandleError('PreviewError', err);
    }
    this.loading = false;
  }

  public async GeneratePreview(
    projectId: string,
    offset: number,
    path: string,
    logs: TraceTransactionLog[],
    baseProjectId?: string): Promise<void> {
    try {
      this.loading = true;
      const url = await this.previewService.GeneratePreview(projectId, offset, logs, baseProjectId);

      if (!this.loading) {
        return;
      }

      this.ShowPreview(url, path);
    } catch (err) {
      this.errorServer.HandleError('PreviewError', err);
    }
    this.loading = false;
  }

  public ClosePreview() {
    this.previewBaseUrl = '';
    this.previewPath = '';
    this.loading = false;
  }

  private async ShowPreview(url: string, path: string): Promise<void> {
    if (!url) {
      this.errorServer.HandleError('PreviewError', ' preview url failed to be retrieved');
      return;
    }

    this.zone.runTask(() => {
      this.previewBaseUrl = url;
      this.previewPath = path;
    });
  }
}
