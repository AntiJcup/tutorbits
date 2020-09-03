import { Component, OnInit } from '@angular/core';
import { IPlaybackMouseService } from 'src/app/services/abstract/IPlaybackMouseService';

@Component({
  selector: 'app-playback-mouse',
  templateUrl: './playback-mouse.component.html',
  styleUrls: ['./playback-mouse.component.sass']
})
export class PlaybackMouseComponent implements OnInit {
  public get x(): number {
    return this.playbackMouseService.position.x;
  }
  public get y(): number {
    return this.playbackMouseService.position.y;
  }

  constructor(protected playbackMouseService: IPlaybackMouseService) { }

  ngOnInit() {
  }
}
