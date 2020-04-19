import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateAnswer } from 'src/app/models/answer/create-answer';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewAnswer } from 'src/app/models/answer/view-answer';
import { TutorBitsAnswerService } from 'src/app/services/question/tutor-bits-answer.service';
import { ICacheService } from 'src/app/services/abstract/ICacheService';

@Component({
  selector: 'app-create-answer',
  templateUrl: './create-answer.component.html',
  styleUrls: ['./create-answer.component.sass']
})
export class CreateAnswerComponent implements OnInit {
  @Input()
  public targetId: string;

  @Input()
  public answerService: TutorBitsAnswerService;

  @Output()
  public answerAdded = new EventEmitter();

  loading = false;

  form = new FormGroup({});
  model: CreateAnswer = { title: 'answer', body: null, targetId: this.targetId };
  fields: FormlyFieldConfig[] = [
    {
      model: this.model,
      key: 'body',
      type: 'textarea',
      templateOptions: {
        label: 'Answer',
        placeholder: 'Your answer here',
        required: true,
        minLength: 1,
        maxLength: 1028,
        rows: 12
      }
    }
  ];

  constructor(
    private errorServer: IErrorService,
    private logServer: ILogService,
    private cache: ICacheService) { }

  ngOnInit() {
  }

  async submit(model: CreateAnswer) {
    model.targetId = this.targetId;
    this.logServer.LogToConsole('CreateAnswer', model);
    this.loading = true;

    try {
      const res: ResponseWrapper<ViewAnswer> = await this.answerService.Create(model);
      if (res.error) {
        this.errorServer.HandleError('CreateError', JSON.stringify(res.error));
      }

      this.cache.ClearCache();
      this.answerAdded.next(res.data as ViewAnswer);
    } catch (err) {
      this.errorServer.HandleError('CreateError', err);
    }

    this.loading = false;
  }

}
