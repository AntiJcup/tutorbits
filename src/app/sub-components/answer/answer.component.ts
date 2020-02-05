import { Component, OnInit, Input } from '@angular/core';
import { ViewAnswer } from 'src/app/models/answer/view-answer';
import { DateUtils } from 'shared/web/lib/ts/DateUtils';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.sass']
})
export class AnswerComponent implements OnInit {
  @Input()
  public answer: ViewAnswer;

  public get answerDate(): string {
    return DateUtils.ConvertServerMSToLocal(this.answer.dateCreated).toLocaleString();
  }

  constructor() { }

  ngOnInit() {
  }

}
