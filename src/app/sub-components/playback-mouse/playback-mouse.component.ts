import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-playback-mouse',
  templateUrl: './playback-mouse.component.html',
  styleUrls: ['./playback-mouse.component.sass']
})
export class PlaybackMouseComponent implements OnInit {
  public x: number;
  public y: number;

  constructor() { }

  ngOnInit() {
  }

  public Move(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

}
