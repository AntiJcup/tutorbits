import { Component, OnInit, Input } from '@angular/core';
import { TutorBitsBaseRatingService } from 'src/app/services/abstract/tutor-bits-base-rating.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.sass']
})
export class RatingComponent implements OnInit {
  @Input() targetId: string;
  @Input() ratingService: TutorBitsBaseRatingService;
  @Input() showControls = false;

  public loading = true;
  private score = 1;

  constructor(private errorServer: IErrorService) { }

  ngOnInit() {
    this.ratingService.GetScore(this.targetId).then((score) => {
      this.score = score;
    }).catch((err) => {
      this.errorServer.HandleError('Rating', `Error loading score`);
    }).finally(() => {
      this.loading = false;
    });
  }

}
