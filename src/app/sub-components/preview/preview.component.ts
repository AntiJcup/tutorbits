import { Component, OnInit, Input, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { IPreviewService, PreviewEvents } from 'src/app/services/abstract/IPreviewService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { EventSub } from 'shared/web/lib/ts/EasyEventEmitter';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.sass']
})

export class PreviewComponent implements OnInit, OnDestroy {
  private showSub: EventSub;
  private hideSub: EventSub;
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
    private zone: NgZone,
    private changeDetector: ChangeDetectorRef,
    private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.showSub = this.previewService.sub(PreviewEvents[PreviewEvents.RequestShow],
      async (projectId: string, offset: number, url: string, path: string) => {
        await this.ShowPreview(url, path);
        this.changeDetector.detectChanges();
      });

    this.hideSub = this.previewService.sub(PreviewEvents[PreviewEvents.RequestHide],
      async () => {
        this.changeDetector.detectChanges();
      });
  }

  ngOnDestroy() {
    if (this.showSub) {
      this.showSub.Dispose();
    }

    if (this.hideSub) {
      this.hideSub.Dispose();
    }
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
