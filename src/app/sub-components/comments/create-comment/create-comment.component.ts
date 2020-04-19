import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CreateComment } from 'src/app/models/comment/create-comment';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { ICacheService } from 'src/app/services/abstract/ICacheService';

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
  model: CreateComment = { title: 'comment', body: null, targetId: this.targetId };
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
    private cache: ICacheService) { }

  ngOnInit() {
  }

  async submit(model: CreateComment) {
    model.targetId = this.targetId;
    this.logServer.LogToConsole('CreateComment', model);
    this.loading = true;

    try {
      const res: ResponseWrapper<ViewComment> = await this.commentService.Create(model)
      if (res.error) {
        this.errorServer.HandleError('CreateError', JSON.stringify(res.error));
      }

      this.cache.ClearCache();
      this.commentAdded.next(res.data as ViewComment);
    } catch (err) {
      this.errorServer.HandleError('CreateError', err);
    }

    this.loading = false;
  }

}
