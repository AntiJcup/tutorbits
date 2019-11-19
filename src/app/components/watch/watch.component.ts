import { Component, OnInit, ViewChild, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { OnlineProjectLoader, OnlineTransactionLoader } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { PlaybackEditorComponent } from 'src/app/sub-components/playback-editor/playback-editor.component';
import { PlaybackFileTreeComponent } from 'src/app/sub-components/playback-file-tree/playback-file-tree.component';
import { MonacoPlayer } from 'src/app/sub-components/player/monaco.player';
import { ApiHttpRequest, ApiHttpRequestInfo } from 'shared/web/lib/ts/ApiHttpRequest';
import { VidPlayer } from 'src/app/sub-components/player/vid.player';
import { OnlineStreamLoader } from 'shared/media/lib/ts/OnlineStreamLoader';
import { TransactionPlayerState } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { OnlinePreviewGenerator } from 'shared/Tracer/lib/ts/OnlinePreviewGenerator';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';

@Component({
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.sass']
})

export class WatchComponent implements OnInit, OnDestroy {
  public projectId: string;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj: ApiHttpRequest = new ApiHttpRequest(this.requestInfo);

  @ViewChild(PlaybackFileTreeComponent, { static: true }) playbackTreeComponent: PlaybackFileTreeComponent;
  @ViewChild(PlaybackEditorComponent, { static: true }) playbackEditor: PlaybackEditorComponent;
  @ViewChild('video', { static: true }) playbackVideo: ElementRef;

  codePlayer: MonacoPlayer;
  videoPlayer: VidPlayer;

  paceKeeperInterval: any;
  paceKeperPosition = 0;
  paceKeeperCheckSpeedMS = 100;
  paceKeeperMaxDifferenceMS = 200;

  pausedVideo = false;
  lastVideoTime = 0;

  previewPath: string = null;
  previewBaseUrl: string = null;
  loadingPreview = false;

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private errorServer: IErrorService,
    private logServer: ILogService) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
  }

  ngOnInit(): void {
    const requestObj = new ApiHttpRequest(this.requestInfo);
    this.videoPlayer = new VidPlayer(new OnlineStreamLoader(this.projectId, requestObj), this.playbackVideo.nativeElement);
    this.videoPlayer.Load().then().catch((e) => {
      this.errorServer.HandleError(`VideoError`, e);
    });

  }

  ngOnDestroy(): void {
    clearInterval(this.paceKeeperInterval);
  }

  onCodeInitialized(playbackEditor: PlaybackEditorComponent) {
    this.codePlayer = new MonacoPlayer(
      this.playbackEditor,
      this.playbackTreeComponent,
      this.logServer,
      new OnlineProjectLoader(this.requestObj, 'play'),
      new OnlineTransactionLoader(this.requestObj),
      this.projectId);

    this.codePlayer.Load().then(() => {
      this.codePlayer.Play();
      this.playbackVideo.nativeElement.play();
      this.paceKeeperInterval = setInterval(() => {
        this.paceKeeperLoop();
      }, this.paceKeeperCheckSpeedMS);
    }).catch((e) => {
      this.errorServer.HandleError(`CodeError`, e);
    });
  }

  paceKeeperLoop() {
    if (!this.codePlayer) {
      return;
    }
    const currentVideoTime = this.videoPlayer.player.currentTime * 1000;
    if (this.videoPlayer.IsBuffering() && !this.pausedVideo) {
      this.paceKeperPosition = this.codePlayer.position = currentVideoTime;
      return;
    }

    if (this.codePlayer.state === TransactionPlayerState.Paused || this.codePlayer.isBuffering) {
      if (!this.videoPlayer.player.paused) {
        this.videoPlayer.player.pause();
        this.pausedVideo = true;
      }
      return;
    }

    if (this.pausedVideo) {
      this.videoPlayer.player.play();
      this.pausedVideo = false;
    }

    if (Math.abs(currentVideoTime - this.lastVideoTime) > this.paceKeeperMaxDifferenceMS) {
      this.paceKeperPosition = currentVideoTime;
    } else {
      this.paceKeperPosition += this.paceKeeperCheckSpeedMS;
    }

    this.codePlayer.position = this.paceKeperPosition;
    this.lastVideoTime = currentVideoTime;
  }

  public onPreviewClicked(e: string) {
    this.loadingPreview = true;
    const previewGenerator = new OnlinePreviewGenerator(this.requestObj);
    const previewPos = Math.round(this.codePlayer.position);
    previewGenerator.LoadPreview(this.projectId, previewPos).then((url) => {
      if (!url) {
        this.errorServer.HandleError(`PreviewError`, 'failed to be retrieved');
        return;
      }
      this.zone.runTask(() => {
        this.previewBaseUrl = url;
        this.previewPath = e;
      });
    }).catch((err) => {
      this.errorServer.HandleError(`PreviewError`, err);
    }).finally(() => {
      this.loadingPreview = false;
    });
  }

  public onCloseClicked(e: any) {
    this.previewPath = null;
    this.loadingPreview = false;
  }
}
