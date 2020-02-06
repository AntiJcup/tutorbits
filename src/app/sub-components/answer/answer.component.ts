import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewAnswer } from 'src/app/models/answer/view-answer';
import { DateUtils } from 'shared/web/lib/ts/DateUtils';
import { TutorBitsAnswerRatingService } from 'src/app/services/question/tutor-bits-answer-rating.service';
import { TutorBitsAnswerCommentService } from 'src/app/services/question/tutor-bits-answer-comment.service';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.sass']
})
export class AnswerComponent implements OnInit {
  @Input()
  public answer: ViewAnswer;

  @Output()
  public commentsClicked: EventEmitter<void> = new EventEmitter<void>();

  public get answerDate(): string {
    return DateUtils.ConvertServerMSToLocal(this.answer.dateCreated).toLocaleString();
  }

  constructor(
    public ratingService: TutorBitsAnswerRatingService,
    public commentService: TutorBitsAnswerCommentService) { }

  ngOnInit() {
  }

  public onCommentsClicked(e: any) {
    this.commentsClicked.emit();
  }
}
