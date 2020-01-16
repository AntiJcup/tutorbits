import { IAPIService } from '../abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { TutorBitsBaseRatingService } from '../abstract/tutor-bits-base-rating.service';

// Import this as your service so tests can override it
export abstract class TutorBitsAnswerRatingService extends TutorBitsBaseRatingService {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}

@Injectable()
export class TutorBitsConcreteAnswerRatingService extends TutorBitsAnswerRatingService {
  protected readonly basePath = `api/AnswerRating`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}
