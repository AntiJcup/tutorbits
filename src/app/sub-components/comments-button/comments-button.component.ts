import { Component, OnInit, Input } from '@angular/core';
import { SavingButtonComponent } from '../saving-button/saving-button.component';
import { TutorBitsBaseCommentService } from 'src/app/services/abstract/tutor-bits-base-comment.service';

@Component({
  selector: 'app-comments-button',
  templateUrl: './comments-button.component.html',
  styleUrls: ['./comments-button.component.sass']
})
export class CommentButtonComponent implements OnInit {
  @Input() targetId: string;
  @Input() commentService: TutorBitsBaseCommentService;
  @Input() disabled = false;

  private text = 'Comments';

  constructor() { }

  ngOnInit() {
    this.commentService.GetCommentCount(this.targetId).then((count) => {
      this.text = `Comments (${count})`;
    });
  }
}
