import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';
import { Router } from '@angular/router';
import { TutorBitsQuestionService } from 'src/app/services/question/tutor-bits-question.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { Meta } from '@angular/platform-browser';
import { DeleteQuestionEvent } from 'src/app/sub-components/questions/edit-question-card/edit-question-card.component';

@Component({
  templateUrl: './view-questions.component.html',
  styleUrls: ['./view-questions.component.sass']
})
export class ViewQuestionsComponent implements OnInit, OnDestroy {
  questions: Array<ViewQuestion> = [];
  questionsByType: { [key: string]: ViewQuestion[] } = {};
  questionTypes: string[] = [];
  loading = true;
  allKey = 'All';

  constructor(
    private router: Router,
    private questionsService: TutorBitsQuestionService,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private titleService: ITitleService,
    private metaService: Meta) { }

  async ngOnInit() {
    this.titleService.SetTitle('TutorBits - Questions');
    this.metaService.updateTag({
      name: 'description',
      content: `TutorBits - Home to a better programming question experience. Watch as programmers write code, interact, and test the code as they write it.`
    },
      'name=\'description\'');

    try {
      const questions = await this.questionsService.GetAllCached();
      this.questions = questions;
      this.logServer.LogToConsole('ViewQuestions', questions.length);
      this.questions.forEach(element => {
        this.questionsByType[this.allKey] = this.questionsByType[this.allKey] ? this.questionsByType[this.allKey] : [];
        this.questionsByType[this.allKey].push(element);

        this.questionsByType[element.topic] = this.questionsByType[element.topic] ? this.questionsByType[element.topic] : [];
        this.questionsByType[element.topic].push(element);

        if (this.questionTypes.indexOf(element.topic) === -1) {
          this.questionTypes.push(element.topic);
        }
      });

      this.questionTypes.push(this.allKey);
    } catch (e) {
      this.errorServer.HandleError('ViewQuestions', e);
    }
    this.loading = false;
  }

  onQuestionCardClick(e: any, question: ViewQuestion) {
    this.logServer.LogToConsole('ViewQuestions', 'card clicked', question);
  }

  ngOnDestroy(): void {
    this.metaService.removeTag('name=\'description\'');
  }

  async onDeleteClicked(e: DeleteQuestionEvent) {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await this.questionsService.Delete(e.question.id);
    } catch (err) {
      this.errorServer.HandleError('ViewQuestionsComponent', `Failed deleting tutorial: ${err}`);
    }

    const index = this.questions.indexOf(e.question);
    if (index === -1) {
      this.errorServer.HandleError('ViewQuestionsComponent', `Failed removing tutorial card, doesn't exist`);
      return;
    }

    this.questions.splice(index, 1);
  }
}
