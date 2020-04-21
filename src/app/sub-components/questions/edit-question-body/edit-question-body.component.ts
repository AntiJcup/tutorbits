import { Component, OnInit, Input, NgZone, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { UpdateQuestion } from 'src/app/models/question/update-question';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewQuestion } from 'src/app/models/question/view-question';
import { TutorBitsQuestionService } from 'src/app/services/question/tutor-bits-question.service';
import { ICacheService } from 'src/app/services/abstract/ICacheService';

@Component({
  selector: 'app-edit-question',
  templateUrl: './edit-question-body.component.html',
  styleUrls: ['./edit-question-body.component.sass']
})
export class EditQuestionBodyComponent implements OnInit {
  @Input()
  public question: ViewQuestion;

  @Output()
  public updated = new EventEmitter();

  @Output()
  public cancelled = new EventEmitter();

  loading = false;

  form = new FormGroup({});
  model: UpdateQuestion;
  fields: FormlyFieldConfig[] = [];

  constructor(
    private errorServer: IErrorService,
    private logServer: ILogService,
    private questionService: TutorBitsQuestionService) { }

  ngOnInit() {
    this.model = { id: this.question.id, title: this.question.title, description: this.question.description };

    this.fields = [{
      model: this.model,
      key: 'description',
      type: 'textarea',
      defaultValue: this.question.description,
      templateOptions: {
        label: 'Edit',
        placeholder: 'Your question description here',
        required: true,
        minLength: 1,
        maxLength: 1028,
        rows: 12
      }
    }];
  }

  async submit(model: UpdateQuestion) {
    this.logServer.LogToConsole('EditQuestion', model);
    this.loading = true;

    try {
      const res: ResponseWrapper<ViewQuestion> = await this.questionService.Update(model);
      if (res.error) {
        this.errorServer.HandleError('EditError', JSON.stringify(res.error));
      }

      this.updated.next(res.data as ViewQuestion);
    } catch (err) {
      this.errorServer.HandleError('EditError', err);
    }

    this.loading = false;
  }

  onCancelClicked(e: any) {
    this.cancelled.emit();
  }
}
