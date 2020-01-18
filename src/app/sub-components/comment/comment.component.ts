import { Component, OnInit, Input } from '@angular/core';
import { ViewComment } from 'src/app/models/comment/view-comment';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.sass']
})
export class CommentComponent implements OnInit {
  @Input()
  public comment: ViewComment;

  constructor() { }

  ngOnInit() {
  }

}
