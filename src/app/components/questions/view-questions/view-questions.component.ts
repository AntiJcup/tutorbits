import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViewQuestion } from 'src/app/models/question/view-question';
import { Router } from '@angular/router';
import { TutorBitsQuestionService } from 'src/app/services/question/tutor-bits-question.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { Meta } from '@angular/platform-browser';

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
    this.titleService.SetTitle('TutorBits - Gallery');
    this.metaService.updateTag({
      name: 'description',
      content: `TutorBits - Home to a better programming question experience. Watch as programmers write code, interact, and test the code as they write it.`
    },
      'name=\'description\'');

    try {
      const questions = await this.questionsService.GetAll();
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
}
