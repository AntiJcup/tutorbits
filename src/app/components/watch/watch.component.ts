import { Component, OnInit, ViewChild, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { OnlineProjectLoader, OnlineTransactionLoader } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaybackEditorComponent } from 'src/app/sub-components/playback-editor/playback-editor.component';
import { PlaybackFileTreeComponent } from 'src/app/sub-components/playback-file-tree/playback-file-tree.component';
import { MonacoPlayer } from 'src/app/sub-components/player/monaco.player';
import { ApiHttpRequest, ApiHttpRequestInfo } from 'shared/web/lib/ts/ApiHttpRequest';
import { VidPlayer } from 'src/app/sub-components/player/vid.player';
import { OnlineStreamLoader } from 'shared/media/lib/ts/OnlineStreamLoader';
import { TransactionPlayerState } from 'shared/Tracer/lib/ts/TransactionPlayer';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { TutorBitsTutorialService } from 'src/app/services/tutorial/tutor-bits-tutorial.service';
import { Guid } from 'guid-typescript';
import { ITracerProjectService } from 'src/app/services/abstract/ITracerProjectService';
import { ResourceViewerComponent } from 'src/app/sub-components/resource-viewer/resource-viewer.component';
import { Subscription } from 'rxjs';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { PlaybackMouseComponent } from 'src/app/sub-components/playback-mouse/playback-mouse.component';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { MatDialog } from '@angular/material';
import { WatchGuideComponent } from 'src/app/sub-components/watch-guide/watch-guide.component';
import { IDataService } from 'src/app/services/abstract/IDataService';
import { Meta } from '@angular/platform-browser';
import { TutorBitsTutorialCommentService } from 'src/app/services/tutorial/tutor-bits-tutorial-comment.service';
import { ViewComment } from 'src/app/models/comment/view-comment';

@Component({
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.sass']
})

export class WatchComponent implements OnInit, OnDestroy {
  public projectId: string;
  public title: string;
  public started = false;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };
  requestObj: ApiHttpRequest = new ApiHttpRequest(this.requestInfo);

  @ViewChild(PlaybackFileTreeComponent, { static: true }) playbackTreeComponent: PlaybackFileTreeComponent;
  @ViewChild(PlaybackEditorComponent, { static: true }) playbackEditor: PlaybackEditorComponent;
  @ViewChild('video', { static: true }) playbackVideo: ElementRef;
  @ViewChild(ResourceViewerComponent, { static: true }) resourceViewerComponent: ResourceViewerComponent;
  @ViewChild(PlaybackMouseComponent, { static: true }) playbackMouseComponent: PlaybackMouseComponent;
  @ViewChild(PreviewComponent, { static: true }) previewComponent: PreviewComponent;

  codePlayer: MonacoPlayer;
  videoPlayer: VidPlayer;

  paceKeeperInterval: any;
  paceKeperPosition = 0;
  paceKeeperCheckSpeedMS = 100;
  paceKeeperMaxDifferenceMS = 200;

  pausedVideo = false;
  lastVideoTime = 0;

  publishing = false;
  publishMode = false;

  downloading = false;

  loadingReferences = 0;

  loadingComments = false;
  comments: ViewComment[];
  showCommentSection = false;

  private onLoadStartSub: Subscription;
  private onLoadCompleteSub: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private tutorialService: TutorBitsTutorialService,
    private projectService: ITracerProjectService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private eventService: IEventService,
    private titleService: ITitleService,
    public dialog: MatDialog,
    private dataService: IDataService,
    private metaService: Meta,
    private commentService: TutorBitsTutorialCommentService) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.title = this.route.snapshot.paramMap.get('title');
    this.publishMode = this.route.snapshot.queryParamMap.get('publish') === 'true';

    if (this.title) {
      this.titleService.SetTitle(`${this.title} - TutorBits Tutorial`);
    }
  }

  ngOnInit(): void {
    const requestObj = new ApiHttpRequest(this.requestInfo);
    this.videoPlayer = new VidPlayer(new OnlineStreamLoader(this.projectId, requestObj,
      this.publishMode ? Guid.create().toString() : 'play'), this.playbackVideo.nativeElement);
    this.videoPlayer.Load().then().catch((e) => {
      this.errorServer.HandleError(`VideoError`, e);
    });

    this.tutorialService.Get(this.projectId).then((tutorial: ViewTutorial) => {
      this.titleService.SetTitle(`${tutorial.title} - ${tutorial.topic} Tutorial - TutorBits`);
      this.metaService.updateTag({ name: 'description', content: `TutotorBits Tutorial - ${tutorial.title}: ${tutorial.description}` },
        'name=\'description\'');
    });

    if (!this.dataService.GetShownWatchHelp()) {
      this.dialog.open(WatchGuideComponent);
      this.dataService.SetShownWatchHelp(true);
    }
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');
    clearInterval(this.paceKeeperInterval);

    if (this.onLoadStartSub) {
      this.onLoadStartSub.unsubscribe();
    }

    if (this.onLoadCompleteSub) {
      this.onLoadCompleteSub.unsubscribe();
    }

    if (this.codePlayer) {
      this.codePlayer.Dispose();
    }
  }

  onCodeInitialized(playbackEditor: PlaybackEditorComponent) {
    // If publish mode make sure not to cache!
    this.codePlayer = new MonacoPlayer(
      this.playbackEditor,
      this.playbackTreeComponent,
      this.resourceViewerComponent,
      this.playbackMouseComponent,
      this.previewComponent,
      this.logServer,
      new OnlineProjectLoader(this.requestObj, this.publishMode ? Guid.create().toString() : 'play'),
      new OnlineTransactionLoader(this.requestObj, this.publishMode ? Guid.create().toString() : 'play'),
      this.projectId);

    this.onLoadStartSub = this.codePlayer.loadStart.subscribe((event) => {
      this.loadingReferences++;
    });

    this.onLoadCompleteSub = this.codePlayer.loadComplete.subscribe((event) => {
      this.loadingReferences--;
    });

    this.codePlayer.Load().then(() => {
      this.codePlayer.Play();
      this.playbackVideo.nativeElement.volume = 0.5;
      // this.playbackVideo.nativeElement.play();
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
    if (currentVideoTime === 0) {
      this.codePlayer.SetPostionPct(1);
      return;
    }

    if (!this.started) {
      this.started = true;
    }

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
    this.eventService.TriggerButtonClick('Watch', `Preview - ${this.projectId} - ${e}`);
    const previewPos = Math.min(Math.round(this.codePlayer.position), this.codePlayer.duration);
    this.previewComponent.LoadPreview(this.projectId, previewPos, e).then()
      .catch((err) => {
        this.errorServer.HandleError(`PreviewError`, err);
      });
  }

  public onPreviewClosed(e: any) {
    this.eventService.TriggerButtonClick('Watch', `PreviewClose - ${this.projectId}`);
    this.previewComponent.ClosePreview();
  }

  
  public onCommentsClosed(e: any) {
    this.eventService.TriggerButtonClick('Watch', `CommentsClose - ${this.projectId}`);
    this.showCommentSection = false;
  }

  public onPublishClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Publish - ${this.projectId}`);
    this.publishing = true;
    this.tutorialService.Publish(this.projectId).then((res) => {
      if (!res) {
        this.errorServer.HandleError('FinishError', 'Failed To Save Try Again');
      } else {
        this.zone.runTask(() => {
          this.publishMode = false;
        });
      }
    }).catch((err) => {
      this.errorServer.HandleError('FinishError', err);
    }).finally(() => {
      this.publishing = false;
    });
  }

  public onBackClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Back - ${this.projectId}`);
    if (!confirm('Are you sure you want to start over?')) {
      return;
    }

    this.router.navigate([`record/${this.projectId}`], { queryParams: { back: 'true' } });
  }

  public onDownloadClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Download - ${this.projectId}`);
    this.downloading = true;
    this.projectService.DownloadProject(this.projectId).then((res) => {
      if (!res) {
        this.errorServer.HandleError('DownloadProject', `Error downloading project`);
        return;
      }
    }).catch((err) => {
      this.errorServer.HandleError('DownloadProject', `${err}`);
    }).finally(() => {
      this.downloading = false;
    });
  }

  public onCopyToSandboxClicked(e: any, newWindow: boolean) {
    this.eventService.TriggerButtonClick('Watch', `Sandbox - ${this.projectId}`);
    // this.router.navigate([`sandbox/${this.projectId}`]);
    if (newWindow) {
      window.open(`sandbox/${this.projectId}`, 'Sandbox', 'height=720,width=1080');
    } else {
      window.open(`sandbox/${this.projectId}`);
    }
  }

  public onShowHelp() {
    this.dialog.open(WatchGuideComponent);
  }

  public onCommentsClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Comments - ${this.projectId}`);
    this.loadingComments = true;

    this.commentService.GetComments(this.projectId).then((res) => {
      this.showCommentSection = true;

      // Hack because monaco editor needs a resize event to consider the comment section
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 1);

      if (!res) {
        this.errorServer.HandleError('CommentsWatch', `Error loading comments`);
        return;
      }
    }).catch((err) => {
      this.errorServer.HandleError('CommentsWatch', `${err}`);
    }).finally(() => {
      this.loadingComments = false;
    });
  }
}
