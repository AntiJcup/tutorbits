import { Component, OnInit, Input } from '@angular/core';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { DateUtils } from 'shared/web/lib/ts/DateUtils';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.sass']
})
export class CommentComponent implements OnInit {
  @Input()
  public comment: ViewComment;

  public get commentDate(): string {
    return DateUtils.ConvertServerMSToLocal(this.comment.dateCreated).toLocaleString();
  }

  constructor() { }

  ngOnInit() {
  }

}
