import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';
import { IAuthService } from 'src/app/services/abstract/IAuthService';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.sass']
})
export class CommentSectionComponent implements OnInit {
  @Input()
  public comments: ViewComment[] = [];

  @Input()
  public targetId: string;

  @Input()
  public commentService: TutorBitsBaseCommentService;

  @Output()
  public closeClicked = new EventEmitter();

  public addingComment = false;
  public loggedIn = false;

  constructor(private auth: IAuthService) { }

  ngOnInit() {
    this.loggedIn = this.auth.IsLoggedIn();
  }

  onCloseClicked() {
    this.closeClicked.next();
  }

  onAddComment() {
    this.addingComment = true;
  }

  onCommentAdded(e: ViewComment) {
    this.addingComment = false;

    // Add to viewcomments
    this.comments.push(e);
  }
}
