import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';

export interface DeleteQuestionEvent {
  question: ViewQuestion;
}

@Component({
  selector: 'app-edit-question-card',
  templateUrl: './edit-question-card.component.html',
  styleUrls: ['./edit-question-card.component.sass']
})
export class EditQuestionCardComponent implements OnInit {
  @Input() question: ViewQuestion;

  @Output() DeleteClick: EventEmitter<DeleteQuestionEvent> = new EventEmitter<DeleteQuestionEvent>();

  get questionSubTitle(): string {
    return `${this.question.topic} - ${this.question.status}`;
  }

  constructor() { }

  ngOnInit() {
  }

  public onDeleteClicked(e: MouseEvent) {
    e.stopImmediatePropagation();
    this.DeleteClick.next({
      question: this.question
    } as DeleteQuestionEvent);
  }
}
