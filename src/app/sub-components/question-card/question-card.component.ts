import { Component, OnInit, Input } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';

@Component({
  selector: 'app-question-card',
  templateUrl: './question-card.component.html',
  styleUrls: ['./question-card.component.sass']
})
export class QuestionCardComponent implements OnInit {
  @Input() question: ViewQuestion;

  get questionDuration(): string {
    const baseSeconds = this.question.durationMS / 1000;
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

  get questionSubTitle(): string {
    return `${this.question.score} - ${this.question.owner} - ${this.question.topic} - ${this.questionDuration}`;
  }

  constructor() { }

  ngOnInit() {
  }

}
