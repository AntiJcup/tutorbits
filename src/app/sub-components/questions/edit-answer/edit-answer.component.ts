import { Component, OnInit, Input, NgZone, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { UpdateAnswer } from 'src/app/models/answer/update-answer';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewAnswer } from 'src/app/models/answer/view-answer';
import { TutorBitsAnswerService } from 'src/app/services/question/tutor-bits-answer.service';
import { ICacheService } from 'src/app/services/abstract/ICacheService';

@Component({
  selector: 'app-edit-answer',
  templateUrl: './edit-answer.component.html',
  styleUrls: ['./edit-answer.component.sass']
})
export class EditAnswerComponent implements OnInit {
  @Input()
  public answer: ViewAnswer;

  @Output()
  public updated = new EventEmitter();

  @Output()
  public cancelled = new EventEmitter();

  loading = false;

  form = new FormGroup({});
  model: UpdateAnswer;
  fields: FormlyFieldConfig[] = [];

  constructor(
    private errorServer: IErrorService,
    private logServer: ILogService,
    private answerService: TutorBitsAnswerService,
    private cache: ICacheService) { }

  ngOnInit() {
    this.model = { id: this.answer.id, title: 'answer', body: this.answer.body };

    this.fields = [{
      model: this.model,
      key: 'body',
      type: 'textarea',
      defaultValue: this.answer.body,
      templateOptions: {
        label: 'Answer',
        placeholder: 'Your answer here',
        required: true,
        minLength: 1,
        maxLength: 1028,
        rows: 12
      }
    }];
  }

  async submit(model: UpdateAnswer) {
    this.logServer.LogToConsole('EditAnswer', model);
    this.loading = true;

    try {
      const res: ResponseWrapper<ViewAnswer> = await this.answerService.Update(model);
      if (res.error) {
        this.errorServer.HandleError('EditError', JSON.stringify(res.error));
      }

      this.cache.ClearCache();
      this.updated.next(res.data as ViewAnswer);
    } catch (err) {
      this.errorServer.HandleError('EditError', err);
    }

    this.loading = false;
  }

  onCancelClicked(e: any) {
    this.cancelled.emit();
  }
}
