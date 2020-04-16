import { Component, OnInit, NgZone } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';
import { Router } from '@angular/router';
import { TutorBitsQuestionService } from 'src/app/services/question/tutor-bits-question.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { DeleteQuestionEvent } from 'src/app/sub-components/questions/edit-question-card/edit-question-card.component';
import { ITitleService } from 'src/app/services/abstract/ITitleService';

@Component({
  templateUrl: './my-questions.component.html',
  styleUrls: ['./my-questions.component.sass']
})
export class MyQuestionsComponent implements OnInit {
  questions: Array<ViewQuestion> = [];
  loading = true;

  constructor(
    private router: Router,
    private questionsService: TutorBitsQuestionService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private titleService: ITitleService,
    private zone: NgZone) { }

  async ngOnInit() {
    this.titleService.SetTitle('My Questions');
    try {
      const questions = await this.questionsService.GetAllByOwner();

      this.zone.runTask(() => {
        this.questions = questions;
      });
      this.logServer.LogToConsole('MyQuestionsComponent', questions.length);
    } catch (e) {
      this.errorServer.HandleError('MyQuestionsComponent', e);
    }

    this.loading = false;
  }

  onQuestionCardClick(e: any, question: ViewQuestion) {
    this.logServer.LogToConsole('MyQuestionsComponent', 'card clicked', question);
    this.router.navigate([`question/${question.id}/${question.title}/${question.topic}`]);
  }

  async onDeleteClicked(e: DeleteQuestionEvent) {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await this.questionsService.Delete(e.question.id);
    } catch (err) {
      this.errorServer.HandleError('MyQuestionsComponent', `Failed deleting question: ${err}`);
    }

    const index = this.questions.indexOf(e.question);
    if (index === -1) {
      this.errorServer.HandleError('MyQuestionsComponent', `Failed removing question card, doesn't exist`);
      return;
    }

    this.questions.splice(index, 1);
  }
}
