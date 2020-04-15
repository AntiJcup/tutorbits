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
  @Input() score = -1; // -1 implies that the comonent needs to load the score itself
  private rating: ViewRating = null;
  public loggedIn = false;

  constructor(
    private auth: IAuthService,
    private errorServer: IErrorService) { }

  async ngOnInit() {
    this.loggedIn = this.auth.IsLoggedIn();

    try {
      if (this.score === -1) {
        this.score = await this.ratingService.GetScore(this.targetId);
      }
    } catch (err) {
      this.errorServer.HandleError('Rating', `Error loading score`);
    }

    try {
      if (this.loggedIn) {
        this.rating = await this.ratingService.GetYourRatingForTarget(this.targetId);
      }
    } catch (err) {
      this.errorServer.HandleError('Rating', `Error loading rating`);
    }
    this.loading = false;
  }

  public async onUpvoteClicked(e: any) {
    if (!this.rating) {
      const createModel = {
        score: 1,
        targetId: this.targetId
      } as CreateRating;

      try {
        const res = await this.ratingService.Create(createModel)
        if (res.error) {
          this.errorServer.HandleError('Rating', `Upvote Create`);
        }
        this.rating = res.data as ViewRating;
      } catch (err) {
        this.errorServer.HandleError('Rating', `Upvote Update ${err}`);
      }
      this.score += 1;
    } else if (this.rating.score !== 1) {
      const updateModel = {
        score: 1,
        targetId: this.targetId,
        id: this.rating.id
      } as UpdateRating;

      try {
        const res = await this.ratingService.Update(updateModel)
        if (res.error) {
          this.errorServer.HandleError('Rating', `Updvote Update ${res.error}`);
        }
        this.rating = res.data as ViewRating;
      } catch (err) {
        this.errorServer.HandleError('Rating', `Updvote Update ${err}`);
      }
      this.score += 2;
    }
  }

  public async onDownvoteClicked(e: any) {
    if (!this.rating) {
      const createModel = {
        score: -1,
        targetId: this.targetId
      } as CreateRating;

      try {
        const res = await this.ratingService.Create(createModel)
        if (res.error) {
          this.errorServer.HandleError('Rating', `Downvote Create`);
        }
        this.rating = res.data as ViewRating;
      } catch (err) {
        this.errorServer.HandleError('Rating', `Downvote Create ${err}`);
      }
      this.score -= 1;
    } else if (this.rating.score !== -1) {
      const updateModel = {
        score: -1,
        targetId: this.targetId,
        id: this.rating.id
      } as UpdateRating;

      try {
        const res = await this.ratingService.Update(updateModel);
        if (res.error) {
          this.errorServer.HandleError('Rating', `Downvote Update ${res.error}`);
        }
        this.rating = res.data as ViewRating;
      } catch (err) {
        this.errorServer.HandleError('Rating', `Downvote Update ${err}`);
      }
      this.score -= 2;
    }
  }

}
