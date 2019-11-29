import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewTutorial } from 'src/app/models/tutorial/view-tutorial';

export interface DeleteTutorialEvent {
  tutorial: ViewTutorial;
}

@Component({
  selector: 'app-edit-tutorial-card',
  templateUrl: './edit-tutorial-card.component.html',
  styleUrls: ['./edit-tutorial-card.component.sass']
})
export class EditTutorialCardComponent implements OnInit {
  @Input() tutorial: ViewTutorial;

  @Output() DeleteClick: EventEmitter<DeleteTutorialEvent> = new EventEmitter<DeleteTutorialEvent>();

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
    return `${this.tutorial.language} - ${this.tutorialDuration} - ${this.tutorial.status}`;
  }

  constructor() { }

  ngOnInit() {
  }

  public onDeleteClicked(e: DeleteTutorialEvent) {
    this.DeleteClick.next({
      tutorial: this.tutorial
    } as DeleteTutorialEvent);
  }
}
