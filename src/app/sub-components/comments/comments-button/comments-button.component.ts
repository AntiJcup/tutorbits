import { Component, OnInit, Input } from '@angular/core';
import { SavingButtonComponent } from '../../buttons/saving-button/saving-button.component';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';

@Component({
  selector: 'app-comments-button',
  templateUrl: './comments-button.component.html',
  styleUrls: ['./comments-button.component.sass']
})
export class CommentButtonComponent implements OnInit {
  @Input() targetId: string;
  @Input() commentService: TutorBitsBaseCommentService;
  @Input() disabled = false;

  public loading = true;

  public text = 'Comments';

  constructor(private errorServer: IErrorService) { }

  async ngOnInit() {
    try {
      const count = await this.commentService.GetCommentCountCached(this.targetId);
      this.text = `Comments: ${count}`;
    } catch (err) {
      this.errorServer.HandleError('CommentsButton', `Error loading comment count`);
    }
    
    this.loading = false;
  }
}
