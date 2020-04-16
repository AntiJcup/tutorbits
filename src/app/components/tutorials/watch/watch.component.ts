import { Component, OnInit, ViewChild, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { OnlineProjectLoader, OnlineTransactionReader } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaybackEditorComponent } from 'src/app/sub-components/playing/playback-editor/playback-editor.component';
import { PlaybackFileTreeComponent } from 'src/app/sub-components/playing/playback-file-tree/playback-file-tree.component';
import { MonacoPlayer } from 'src/app/sub-components/playing/player/monaco.player';
import { ApiHttpRequest, ApiHttpRequestInfo } from 'shared/web/lib/ts/ApiHttpRequest';
import { VidPlayer } from 'src/app/sub-components/playing/player/vid.player';
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
import { PlaybackMouseComponent } from 'src/app/sub-components/playing/playback-mouse/playback-mouse.component';
import { PreviewComponent } from 'src/app/sub-components/preview/preview.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';
import { MatDialog } from '@angular/material';
import { WatchGuideComponent } from 'src/app/sub-components/watch-guide/watch-guide.component';
import { IDataService } from 'src/app/services/abstract/IDataService';
import { Meta } from '@angular/platform-browser';
import { TutorBitsTutorialCommentService } from 'src/app/services/tutorial/tutor-bits-tutorial-comment.service';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { TutorBitsTutorialRatingService } from 'src/app/services/tutorial/tutor-bits-tutorial-rating.service';
import { IVideoService } from 'src/app/services/abstract/IVideoService';
import { Status } from 'src/app/services/abstract/IModelApiService';

@Component({
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.sass']
})

export class WatchComponent implements OnInit, OnDestroy {
  public tutorialId: string;
  tutorial: ViewTutorial;
  public title: string;
  public started = false;
  codeInitialized = false;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

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

  commentsBtnText = 'Comments';

  private onLoadStartSub: Subscription;
  private onLoadCompleteSub: Subscription;

  selectFileSub: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private tutorialService: TutorBitsTutorialService,
    private projectService: ITracerProjectService,
    private videoService: IVideoService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private eventService: IEventService,
    private titleService: ITitleService,
    public dialog: MatDialog,
    private dataService: IDataService,
    private metaService: Meta,
    public commentService: TutorBitsTutorialCommentService, // Dont remove these components use them
    public ratingService: TutorBitsTutorialRatingService) {
    this.tutorialId = this.route.snapshot.paramMap.get('tutorialId');
    this.title = this.route.snapshot.paramMap.get('title');
    this.publishMode = this.route.snapshot.queryParamMap.get('publish') === 'true';

    if (this.title) {
      this.titleService.SetTitle(`${this.title} - TutorBits Tutorial`);
    }
  }

  async ngOnInit() {
    this.selectFileSub = this.playbackTreeComponent.treeComponent.nodeSelected.subscribe(() => {
      this.eventService.TriggerButtonClick('Record', `PreviewClose - ${this.tutorialId}`);
      this.previewComponent.ClosePreview();
    });

    if (!this.dataService.GetShownWatchHelp()) {
      this.dialog.open(WatchGuideComponent);
      this.dataService.SetShownWatchHelp(true);
    }

    try {
      const tutorial = await this.tutorialService.Get(this.tutorialId);
      this.titleService.SetTitle(`${tutorial.title} - ${tutorial.topic} Tutorial - TutorBits`);
      this.metaService.updateTag({ name: 'description', content: `TutotorBits Tutorial - ${tutorial.title}: ${tutorial.description}` },
        'name=\'description\'');
      this.tutorial = tutorial;

      if (this.codeInitialized) {
        this.onReady();
      }

      this.videoPlayer = new VidPlayer(
        this.videoService,
        this.playbackVideo.nativeElement,
        this.tutorial.videoId,
        this.publishMode ? Guid.create().toString() : 'play');
      try {
        await this.videoPlayer.Load();
      } catch (e) {
        this.errorServer.HandleError(`VideoError`, e);
      }
    } catch (e) {
      this.errorServer.HandleError(`Watch`, e);
    }
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');
    clearInterval(this.paceKeeperInterval);

    if (this.selectFileSub) {
      this.selectFileSub.unsubscribe();
    }

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

  async onReady() {
    // If publish mode make sure not to cache!
    this.codePlayer = new MonacoPlayer(
      this.playbackEditor,
      this.playbackTreeComponent,
      this.resourceViewerComponent,
      this.playbackMouseComponent,
      this.previewComponent,
      this.logServer,
      this.projectService,
      this.projectService,
      this.tutorial.projectId,
      null, // Use default settings
      this.publishMode ? Guid.create().toString() : 'play');

    this.onLoadStartSub = this.codePlayer.loadStart.subscribe((event) => {
      this.loadingReferences++;
    });

    this.onLoadCompleteSub = this.codePlayer.loadComplete.subscribe((event) => {
      this.loadingReferences--;
    });

    try {
      await this.codePlayer.Load();
      this.codePlayer.Play();
      this.playbackVideo.nativeElement.volume = environment.defaultVideoVolume;
      this.paceKeeperInterval = setInterval(() => {
        this.paceKeeperLoop();
      }, this.paceKeeperCheckSpeedMS);
    } catch (e) {
      this.errorServer.HandleError(`CodeError`, e);
    }
  }

  // Starting point as monaco will call this when loaded
  async onCodeInitialized(playbackEditor: PlaybackEditorComponent) {
    this.codeInitialized = true;
    if (this.tutorial) {
      await this.onReady();
    }
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

  public async onPreviewClicked(e: string) {
    this.eventService.TriggerButtonClick('Watch', `Preview - ${this.tutorialId} - ${e}`);
    const previewPos = Math.min(Math.round(this.codePlayer.position), this.codePlayer.duration);
    try {
      await this.previewComponent.LoadPreview(this.tutorial.projectId, previewPos, e);
    } catch (err) {
      this.errorServer.HandleError(`PreviewError`, err);
    }
  }

  public onPreviewClosed(e: any) {
    this.eventService.TriggerButtonClick('Watch', `PreviewClose - ${this.tutorialId}`);
    this.previewComponent.ClosePreview();
  }


  public onCommentsClosed(e: any) {
    this.eventService.TriggerButtonClick('Watch', `CommentsClose - ${this.tutorialId}`);
    this.showCommentSection = false;
  }

  public async onPublishClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Publish - ${this.tutorialId}`);
    this.publishing = true;
    try {
      const res = await this.videoService.Publish(this.tutorial.videoId);
      if (!res) {
        this.errorServer.HandleError('FinishError', 'Failed To Save Try Again');
      } else {
        const projectStatusUpdateRes = await this.projectService.Publish(this.tutorial.projectId);
        if (!projectStatusUpdateRes) {
          this.errorServer.HandleError('FinishError', 'Failed To Save Try Again');
        }
        const publishRes = await this.tutorialService.Publish(this.tutorialId);
        if (!publishRes) {
          this.errorServer.HandleError('FinishError', 'Failed To Save Try Again');
        }
        this.zone.runTask(() => {
          this.publishMode = false;
          this.router.navigate([`watch/${this.tutorialId}`]);
        });
      }
    } catch (err) {
      this.errorServer.HandleError('FinishError', err);
    }

    this.publishing = false;
  }

  public onBackClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Back - ${this.tutorialId}`);
    if (!confirm('Are you sure you want to start over?')) {
      return;
    }

    this.router.navigate([`record/${this.tutorialId}`], { queryParams: { back: 'true' } });
  }

  public async onDownloadClicked(e: any) {
    this.eventService.TriggerButtonClick('Watch', `Download - ${this.tutorialId}`);
    this.downloading = true;
    try {
      const res = await this.projectService.DownloadProject(this.tutorial.projectId);
      if (!res) {
        this.errorServer.HandleError('DownloadProject', `Error downloading project`);
        return;
      }
    } catch (err) {
      this.errorServer.HandleError('DownloadProject', `${err}`);
    }
    this.downloading = false;
  }

  public onCopyToSandboxClicked(e: any, newWindow: boolean) {
    this.eventService.TriggerButtonClick('Watch', `Sandbox - ${this.tutorialId}`);
    // this.router.navigate([`sandbox/${this.projectId}`]);
    if (newWindow) {
      window.open(`sandbox/${this.tutorial.projectId}`, 'Sandbox', 'height=720,width=1080');
    } else {
      window.open(`sandbox/${this.tutorial.projectId}`);
    }
  }

  public onShowHelp() {
    this.dialog.open(WatchGuideComponent);
  }

  public onCommentsClicked(e: any) {
    if (this.showCommentSection) {
      return;
    }
    this.eventService.TriggerButtonClick('Watch', `Comments - ${this.tutorialId}`);
    this.showCommentSection = true;
  }
}
