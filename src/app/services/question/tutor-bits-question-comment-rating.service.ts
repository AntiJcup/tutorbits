import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { TutorBitsBaseRatingService } from '../abstract/tutor-bits-base-rating.service';

// Import this as your service so tests can override it
export abstract class TutorBitsQuestionCommentRatingService extends TutorBitsBaseRatingService {
  constructor(requestService: IRequestService, auth: IAuthService) {
    super(requestService, auth);
  }
}

@Injectable()
export class TutorBitsConcreteQuestionCommentRatingService extends TutorBitsQuestionCommentRatingService {
  protected readonly basePath = `api/QuestionCommentRating`;

  constructor(requestService: IRequestService, auth: IAuthService) {
    super(requestService, auth);
  }
}
