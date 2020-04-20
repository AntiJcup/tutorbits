import { Component, OnInit, Input } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';

@Component({
  selector: 'app-question-card',
  templateUrl: './question-card.component.html',
  styleUrls: ['./question-card.component.sass']
})
export class QuestionCardComponent implements OnInit {
  @Input() question: ViewQuestion;

  constructor() { }

  ngOnInit() {
  }

  get createdDate(): string {
    const date = new Date(this.question.dateCreated);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
}
