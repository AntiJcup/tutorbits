import { Component, OnInit, Input } from '@angular/core';
import { TutorBitsBaseRatingService } from 'src/app/services/abstract/tutor-bits-base-rating.service';
import { IErrorService } from 'src/app/services/abstract/IErrorService';
import { ViewRating } from 'src/app/models/rating/view-rating';
import { CreateRating } from 'src/app/models/rating/create-rating';
import { UpdateRating } from 'src/app/models/rating/update-rating';
import { IAuthService } from 'src/app/services/abstract/IAuthService';

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
  private score = 0;
  private rating: ViewRating = null;
  private loggedIn = false;

  constructor(
    private auth: IAuthService,
    private errorServer: IErrorService) { }

  ngOnInit() {
    this.loggedIn = this.auth.IsLoggedIn();
    this.ratingService.GetScore(this.targetId).then((score) => {
      this.score = score;
    }).catch((err) => {
      this.errorServer.HandleError('Rating', `Error loading score`);
    }).finally(() => {
      this.loading = false;
    });

    this.ratingService.GetYourRatingForTarget(this.targetId).then((rating) => {
      this.rating = rating;
    });
  }

  public onUpvoteClicked(e: any) {
    if (!this.rating) {
      const createModel = {
        score: 1,
        targetId: this.targetId
      } as CreateRating;

      this.ratingService.Create(createModel).then((res) => {
        if (res.error) {
          this.errorServer.HandleError('Rating', `Upvote Create`);
        }
        this.rating = res.data as ViewRating;
      }).catch((err) => {
        this.errorServer.HandleError('Rating', `Upvote Update ${err}`);
      });
      this.score += 1;
    } else if (this.rating.score !== 1) {
      const updateModel = {
        score: 1,
        targetId: this.targetId,
        id: this.rating.id
      } as UpdateRating;

      this.ratingService.Update(updateModel).then().catch((err) => {
        this.errorServer.HandleError('Rating', `Updvote Update ${err}`);
      });
      this.score += 2;
    }
  }

  public onDownvoteClicked(e: any) {
    if (!this.rating) {
      const createModel = {
        score: -1,
        targetId: this.targetId
      } as CreateRating;

      this.ratingService.Create(createModel).then((res) => {
        if (res.error) {
          this.errorServer.HandleError('Rating', `Downvote Create`);
        }
        this.rating = res.data as ViewRating;
      }).catch((err) => {
        this.errorServer.HandleError('Rating', `Downvote Create ${err}`);
      });
      this.score -= 1;
    } else if (this.rating.score !== -1) {
      const updateModel = {
        score: -1,
        targetId: this.targetId,
        id: this.rating.id
      } as UpdateRating;

      this.ratingService.Update(updateModel).then().catch((err) => {
        this.errorServer.HandleError('Rating', `Downvote Update ${err}`);
      });
      this.score -= 2;
    }
  }

}
