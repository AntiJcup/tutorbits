import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { TutorBitsQuestionService } from 'src/app/services/question/tutor-bits-question.service';
import { Router } from '@angular/router';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ITitleService } from 'src/app/services/abstract/ITitleService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewQuestion } from 'src/app/models/question/view-question';
import { CreateQuestionForm } from 'src/app/models/question/create-question-form';

@Component({
  templateUrl: './create-question.component.html',
  styleUrls: ['./create-question.component.sass']
})
export class CreateQuestionComponent implements OnInit, OnDestroy {
  loading = false;
  form = new FormGroup({});
  model: CreateQuestionForm = {
    Title: null,
    Description: null,
    Topic: null
  };
  fields: FormlyFieldConfig[] = [];

  constructor(
    private questionService: TutorBitsQuestionService,
    private router: Router,
    private errorServer: IErrorService,
    private logServer: ILogService,
    private zone: NgZone,
    private titleService: ITitleService) { }

  async ngOnInit() {
    this.titleService.SetTitle('Ask Question');
    this.loading = true;
    try {
      const questionTypes = await this.questionService.GetQuestionTopics();
      const questionTypeOptions = [];
      questionTypes.forEach(element => {
        questionTypeOptions.push({
          label: element,
          value: element
        });
      });

      this.zone.runTask(() => {
        this.fields = [{
          key: 'Title',
          type: 'input',
          templateOptions: {
            label: 'Question',
            placeholder: 'Enter Question',
            required: true,
            minLength: 4,
            maxLength: 64
          }
        },
        {
          key: 'Topic',
          type: 'select',
          templateOptions: {
            label: 'Question Topic',
            required: true,
            options: questionTypeOptions
          }
        },
        {
          key: 'Description',
          type: 'textarea',
          templateOptions: {
            label: 'Description',
            placeholder: 'Enter Question Description',
            required: true,
            maxLength: 1028,
            rows: 4
          }
        }];
      });
      this.loading = false;
    } catch (err) {
      this.errorServer.HandleError('CreateQuestionComponent', err);
    }
  }

  ngOnDestroy(): void {
  }

  async submit(model: CreateQuestionForm) {
    this.logServer.LogToConsole('CreateQuestionComponent', model);
    this.loading = true;

    try {
      const createQuestionModel = this.questionService.ConvertForm(model);
      const questionResponse: ResponseWrapper<ViewQuestion> = await this.questionService.Create(createQuestionModel);

      this.logServer.LogToConsole('CreateQuestionComponent', questionResponse);
      if (questionResponse.error != null) {
        this.loading = false;
        this.errorServer.HandleError('CreateQuestionComponent', JSON.stringify(questionResponse.error));
      } else if (await this.questionService.Publish(questionResponse.data.id)) {
        this.loading = false;
        this.router.navigate([`question/${questionResponse.data.id}`]);
      } else {
        this.loading = false;
        this.errorServer.HandleError('CreateQuestionComponent', 'Error publishing');
      }
    } catch (e) {
      this.errorServer.HandleError('CreateQuestionComponent', e);
      this.loading = false;
    }
  }
}
