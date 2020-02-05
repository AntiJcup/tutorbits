import { Component, OnInit, Input } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';

@Component({
  selector: 'app-question-card',
  templateUrl: './question-card.component.html',
  styleUrls: ['./question-card.component.sass']
})
export class QuestionCardComponent implements OnInit {
  @Input() question: ViewQuestion;

  get questionSubTitle(): string {
    return `${this.question.score} - ${this.question.owner} - ${this.question.topic}`;
  }

  constructor() { }

  ngOnInit() {
  }

}
