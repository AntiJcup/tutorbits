import { Component, OnInit, Input } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';

@Component({
  selector: 'app-tutorial-card',
  templateUrl: './tutorial-card.component.html',
  styleUrls: ['./tutorial-card.component.sass']
})
export class TutorialCardComponent implements OnInit {
  @Input() tutorial: ViewTutorial;

  get tutorialDuration(): string {
    const baseSeconds = this.tutorial.durationMS / 1000;
    const hours = Math.floor(baseSeconds / 3600);
    const minutes = Math.floor((baseSeconds - (hours * 3600)) / 60);
    const seconds = Math.floor(baseSeconds - (hours * 3600) - (minutes * 60));

    let hoursStr: string = hours.toString();
    let minutesStr: string = minutes.toString();
    let secondsStr: string = seconds.toString();

    if (hours < 10) { hoursStr = '0' + hoursStr; }
    if (minutes < 10) { minutesStr = '0' + minutesStr; }
    if (seconds < 10) { secondsStr = '0' + secondsStr; }

    return hoursStr + ':' + minutesStr + ':' + secondsStr;
  }

  get tutorialSubTitle(): string {
    return `${this.tutorial.owner} - ${this.tutorial.language} - ${this.tutorialDuration}`;
  }

  constructor() { }

  ngOnInit() {
  }

}
