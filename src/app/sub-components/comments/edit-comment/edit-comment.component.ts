import { Component, OnInit, Input, NgZone, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { UpdateComment } from 'src/app/models/comment/update-comment';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';
import { ILogService } from 'src/app/services/abstract/ILogService';
import { ResponseWrapper } from 'src/app/services/abstract/IModelApiService';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { ICacheService } from 'src/app/services/abstract/ICacheService';

@Component({
  selector: 'app-edit-comment',
  templateUrl: './edit-comment.component.html',
  styleUrls: ['./edit-comment.component.sass']
})
export class EditCommentComponent implements OnInit {
  @Input()
  public comment: ViewComment;

  @Input()
  public commentService: TutorBitsBaseCommentService;

  @Output()
  public updated = new EventEmitter();

  @Output()
  public cancelled = new EventEmitter();

  loading = false;

  form = new FormGroup({});
  model: UpdateComment = null;
  fields: FormlyFieldConfig[] = [];

  constructor(
    private errorServer: IErrorService,
    private logServer: ILogService,
    private cache: ICacheService) { }

  ngOnInit() {
    this.model = { id: this.comment.id, title: 'comment', body: this.comment.body };

    this.fields = [{
      model: this.model,
      key: 'body',
      type: 'textarea',
      defaultValue: this.comment.body,
      templateOptions: {
        label: 'Comment',
        placeholder: 'Your comment here',
        required: true,
        minLength: 1,
        maxLength: 1028,
        rows: 4
      }
    }];
  }

  async submit(model: UpdateComment) {
    this.logServer.LogToConsole('EditComment', model);
    this.loading = true;

    try {
      const res: ResponseWrapper<ViewComment> = await this.commentService.Update(model)
      if (res.error) {
        this.errorServer.HandleError('EditError', JSON.stringify(res.error));
      }

      this.cache.ClearCache();
      this.updated.next(res.data as ViewComment);
    } catch (err) {
      this.errorServer.HandleError('EditError', err);
    }

    this.loading = false;
  }

  onCancelClicked(e: any) {
    this.cancelled.emit();
  }
}
