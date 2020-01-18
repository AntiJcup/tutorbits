import { Component, OnInit, Input, NgZone, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateComment } from 'src/app/models/comment/create-comment';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { RSA_NO_PADDING } from 'constants';

@Component({
  selector: 'app-create-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.sass']
})
export class CreateCommentComponent implements OnInit {
  @Input()
  public targetId: string;

  @Input()
  public commentService: TutorBitsBaseCommentService;

  @Output()
  public commentAdded = new EventEmitter();

  loading = false;

  form = new FormGroup({});
  model: CreateComment = { title: 'tutorialcomment', body: null, targetId: this.targetId };
  fields: FormlyFieldConfig[] = [
    {
      model: this.model,
      key: 'body',
      type: 'textarea',
      templateOptions: {
        label: 'Comment',
        placeholder: 'Your comment here',
        required: true,
        minLength: 1,
        maxLength: 1028,
        rows: 4
      }
    }
  ];

  constructor(
    private errorServer: IErrorService,
    private logServer: ILogService,
    private zone: NgZone) { }

  ngOnInit() {
  }

  submit(model: CreateComment) {
    model.targetId = this.targetId;
    this.logServer.LogToConsole('CreateComment', model);
    this.loading = true;

    this.commentService.Create(model).then((res: ResponseWrapper<ViewComment>) => {
      if (res.error) {
        this.errorServer.HandleError('CreateError', JSON.stringify(res.error));
      }

      this.commentAdded.next(res.data as ViewComment);
    }).catch((err) => {
      this.errorServer.HandleError('CreateError', err);
    }).finally(() => {
      this.loading = false;
    });
  }

}
