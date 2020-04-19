import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ICacheService } from 'src/app/services/abstract/ICacheService';

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
  public loading = true;

  constructor(
    private auth: IAuthService,
    private errorServer: IErrorService,
    private cache: ICacheService) { }

  async ngOnInit() {
    this.loggedIn = this.auth.IsLoggedIn();

    try {
      const res: ViewComment[] = await this.cache.CacheFunc(this.commentService.GetComments, this.commentService, this.targetId);
      // Hack because monaco editor needs a resize event to consider the comment section
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 1);

      if (!res) {
        this.errorServer.HandleError('CommentsSection', `Error loading comments`);
        return;
      }

      this.comments = res;
    } catch (err) {
      this.errorServer.HandleError('CommentsSection', `${err}`);
    }
    this.loading = false;
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
