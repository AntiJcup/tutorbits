import { Component, OnInit } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';
import { ActivatedRoute } from '@angular/router';
import { TutorBitsQuestionCommentService } from 'src/app/services/question/tutor-bits-question-comment.service';
import { TutorBitsQuestionRatingService } from 'src/app/services/question/tutor-bits-question-rating.service';
import { TutorBitsQuestionService } from 'src/app/services/question/tutor-bits-question.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { IEventService } from 'src/app/services/abstract/IEventService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { DateUtils } from 'shared/web/lib/ts/DateUtils';
import { ViewAnswer } from 'src/app/models/answer/view-answer';
import { TutorBitsAnswerService } from 'src/app/services/question/tutor-bits-answer.service';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { TutorBitsAccountService } from 'src/app/services/user/tutor-bits-account.service';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { TutorBitsAnswerCommentService } from 'src/app/services/question/tutor-bits-answer-comment.service';
import { ICacheService } from 'src/app/services/abstract/ICacheService';

@Component({
  templateUrl: './view-question.component.html',
  styleUrls: ['./view-question.component.sass']
})
export class ViewQuestionComponent implements OnInit {
  public questionId: string;
  public questionTopic: string;
  public questionTitle: string;
  public loading = true;
  public question: ViewQuestion;
  public answers: ViewComment[];
  public addingAnswer = false;
  private currentUserId: string;
  public showCommentSection = false;
  public comments: ViewComment[];
  public targetAnswerId: string;
  public showAnswerCommentSection = false;
  public owned = false;
  public editing = false;

  constructor(
    private route: ActivatedRoute,
    private questionService: TutorBitsQuestionService,
    public answerService: TutorBitsAnswerService,
    private errorServer: IErrorService,
    private eventService: IEventService,
    private logServer: ILogService,
    private titleService: ITitleService,
    private authService: IAuthService,
    private accountService: TutorBitsAccountService,
    public commentService: TutorBitsQuestionCommentService, // Dont remove these components use them
    public ratingService: TutorBitsQuestionRatingService,
    public answerCommentService: TutorBitsAnswerCommentService
  ) {
    this.questionId = this.route.snapshot.paramMap.get('questionId');
    this.questionTitle = this.route.snapshot.paramMap.get('questionTitle');
    this.questionTopic = this.route.snapshot.paramMap.get('questionTopic');

    if (!this.questionTitle) {
      this.titleService.SetTitle('Question');
    } else {
      this.titleService.SetTitle(`${this.questionTitle} - ${this.questionTopic} Question`);
    }
  }

  async ngOnInit() {
    try {
      this.question = await this.questionService.GetCached(this.questionId);
      if (!this.question) {
        throw new Error(`No question found matching this id ${this.questionId}`);
      }

      this.titleService.SetTitle(`${this.question.title} - ${this.question.topic} Question`);

      this.answers = await this.answerService.GetCommentsCached(this.questionId);

      if (this.authService.IsLoggedIn()) {
        this.currentUserId = (await this.accountService.GetAccountInformationCached()).id;
        this.owned = this.question.ownerId === this.currentUserId;
      }

    } catch (err) {
      this.errorServer.HandleError('ViewQuestionComponent', err);
    }
    this.loading = false;
  }

  public get askedDate(): string {
    return DateUtils.ConvertServerMSToLocal(this.question.dateCreated).toLocaleString();
  }

  // If not logged in or already an answer dont show this button
  public get showWriteAnswer(): boolean {
    if (!this.currentUserId) {
      return false;
    }
    return !this.answers.find((answer) => {
      return answer.ownerId === this.currentUserId;
    });
  }

  public onWriteAnswerClick(e) {
    this.addingAnswer = true;
  }

  public onAnswerAdded(e: ViewAnswer) {
    this.addingAnswer = false;

    // Add to viewcomments
    this.answers.push(e);
  }

  public onCommentsClicked(e: any) {
    this.showAnswerCommentSection = false;
    if (this.showCommentSection) {
      return;
    }
    this.eventService.TriggerButtonClick('Question', `Comments - ${this.questionId}`);
    this.showCommentSection = true;
  }

  public onCommentsClosed(e: any) {
    this.eventService.TriggerButtonClick('Question', `CommentsClose - ${this.questionId}`);
    this.showCommentSection = false;
  }

  public onAnswerCommentsClicked(e: any, answerId: string) {
    this.showCommentSection = false;
    if (this.showAnswerCommentSection && this.targetAnswerId === answerId) {
      return;
    }

    this.targetAnswerId = answerId;
    this.eventService.TriggerButtonClick('Question', `Answer Comments - ${this.targetAnswerId}`);
    this.showAnswerCommentSection = true;
  }

  public onAnswerCommentsClosed(e: any) {
    this.eventService.TriggerButtonClick('Question', `Answer CommentsClose - ${this.targetAnswerId}`);
    this.showAnswerCommentSection = false;
  }

  onEditClicked(e: any) {
    this.editing = true;
  }

  onUpdated(e: ViewQuestion) {
    this.editing = false;
    this.question = e;
  }

  onUpdateCancel(e: any) {
    this.editing = false;
  }
}
