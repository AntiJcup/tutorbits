import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OnlineProjectLoader, OnlineTransactionLoader } from 'shared/Tracer/lib/ts/OnlineTransaction';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { PlaybackEditorComponent } from 'src/app/sub-components/playback-editor/playback-editor.component';
import { PlaybackFileTreeComponent } from 'src/app/sub-components/playback-file-tree/playback-file-tree.component';
import { MonacoPlayer } from 'src/app/sub-components/player/monaco.player';
import { ApiHttpRequest, ApiHttpRequestInfo } from 'shared/web/lib/ts/ApiHttpRequest';
import { VidPlayer } from 'src/app/sub-components/player/vid.player';
import { OnlineStreamLoader } from 'shared/media/lib/ts/OnlineStreamLoader';

@Component({
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.sass']
})

export class WatchComponent implements OnInit {
  public projectId: string;
  requestInfo: ApiHttpRequestInfo = {
    host: environment.apiHost,
    credentials: undefined,
    headers: {},
  };

  @ViewChild(PlaybackFileTreeComponent, { static: true }) playbackTreeComponent: PlaybackFileTreeComponent;
  @ViewChild(PlaybackEditorComponent, { static: true }) playbackEditor: PlaybackEditorComponent;
  @ViewChild('video', { static: true }) playbackVideo: ElementRef;

  codePlayer: MonacoPlayer;
  videoPlayer: VidPlayer;

  constructor(private route: ActivatedRoute) {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
  }

  ngOnInit(): void {
    const requestObj = new ApiHttpRequest(this.requestInfo);
    this.videoPlayer = new VidPlayer(new OnlineStreamLoader(this.projectId, requestObj), this.playbackVideo.nativeElement);
    this.videoPlayer.Load().then();
  }

  onCodeInitialized(playbackEditor: PlaybackEditorComponent) {
    const requestObj = new ApiHttpRequest(this.requestInfo);
    this.codePlayer = new MonacoPlayer(
      this.playbackEditor,
      this.playbackTreeComponent,
      new OnlineProjectLoader(requestObj),
      new OnlineTransactionLoader(requestObj),
      this.projectId);

    this.codePlayer.Load().then(() => {
      this.codePlayer.Play();
      this.playbackVideo.nativeElement.play();
    });
  }
}
