import { Component, OnInit, EventEmitter, Output, Input, NgZone, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { IPreviewService, PreviewEvents } from 'src/app/services/abstract/IPreviewService';
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

export class PreviewComponent implements OnInit, OnDestroy {
  get previewUrl(): SafeUrl {
    return this.previewService.fullUrl;
  }

  @Input()
  set previewPath(path: string) {
    this.previewService.previewPath = path;
  }

  get previewPath(): string {
    return this.previewService.previewPath;
  }

  public get loading(): boolean {
    return this.previewService.loading;
  }

  constructor(
    private previewService: IPreviewService,
    private errorServer: IErrorService,
    private zone: NgZone) { }

  ngOnInit() {
    this.previewService.on(PreviewEvents[PreviewEvents.RequestShow],
      async (projectId: string, offset: number, url: string, path: string) => {
        await this.ShowPreview(url, path);
      });

    this.previewService.on(PreviewEvents[PreviewEvents.RequestHide], () => {
      this.ClosePreview();
    });
  }

  ngOnDestroy() {

  }

  navigate(path: string) {
    this.previewPath = path;
  }

  async onCloseClicked() {
    await this.ClosePreview();
  }

  public async ClosePreview() {
    await this.previewService.HidePreview();
  }

  private async ShowPreview(url: string, path: string): Promise<void> {
    if (!url) {
      this.errorServer.HandleError('PreviewError', ' preview url failed to be retrieved');
      return;
    }

    this.zone.runTask(() => {
      this.previewPath = path;
    });
  }
}
