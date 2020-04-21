import { Component, OnInit, Input } from '@angular/core';
import { ViewComment } from 'src/app/models/comment/view-comment';
import { DateUtils } from 'shared/web/lib/ts/DateUtils';
import { TutorBitsAuthService } from 'src/app/services/user/tutor-bits-auth.service';
import { TutorBitsAccountService } from 'src/app/services/user/tutor-bits-account.service';
import { IAuthService } from 'src/app/services/abstract/IAuthService';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.sass']
})
export class CommentComponent implements OnInit {
  @Input()
  public comment: ViewComment;

  @Input()
  public commentService: TutorBitsBaseCommentService;

  public owned = false;
  public editing = false;

  public get commentDate(): string {
    return DateUtils.ConvertServerMSToLocal(this.comment.dateCreated).toLocaleString();
  }

  constructor(private auth: IAuthService, private account: TutorBitsAccountService) { }

  async ngOnInit(): Promise<void> {
    if (!this.auth.IsLoggedIn()) {
      return;
    }

    this.owned = this.comment.ownerId === (await this.account.GetAccountInformationCached()).id;
  }

  onEditClicked(e: any) {
    this.editing = true;
  }

  onCommentUpdated(e: ViewComment) {
    this.editing = false;
    this.comment = e;
  }

  onCommentUpdateCancel(e: any) {
    this.editing = false;
  }
}
