import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewAnswer } from 'src/app/models/answer/view-answer';
import { DateUtils } from 'shared/web/lib/ts/DateUtils';
import { TutorBitsAnswerRatingService } from 'src/app/services/question/tutor-bits-answer-rating.service';
import { TutorBitsAnswerCommentService } from 'src/app/services/question/tutor-bits-answer-comment.service';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { TutorBitsAccountService } from 'src/app/services/user/tutor-bits-account.service';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.sass']
})
export class AnswerComponent implements OnInit {
  @Input()
  public answer: ViewAnswer;

  @Input()
  public commentsFocused = true;

  @Output()
  public commentsClicked: EventEmitter<void> = new EventEmitter<void>();

  public owned = false;
  public editing = false;

  public get answerDate(): string {
    return DateUtils.ConvertServerMSToLocal(this.answer.dateCreated).toLocaleString();
  }

  constructor(
    public ratingService: TutorBitsAnswerRatingService,
    public commentService: TutorBitsAnswerCommentService,
    private auth: IAuthService,
    private account: TutorBitsAccountService) { }

  async ngOnInit(): Promise<void> {
    if (!this.auth.IsLoggedIn()) {
      return;
    }

    this.owned = this.answer.ownerId === (await this.account.GetAccountInformation()).id;
  }

  public onCommentsClicked(e: any) {
    this.commentsClicked.emit();
  }

  onEditClicked(e: any) {
    this.editing = true;
  }

  onUpdated(e: ViewAnswer) {
    this.editing = false;
    this.answer = e;
  }

  onUpdateCancel(e: any) {
    this.editing = false;
  }
}
