import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { TutorBitsBaseRatingService } from '../abstract/tutor-bits-base-rating.service';
import { ICacheService } from '../abstract/ICacheService';

// Import this as your service so tests can override it
export abstract class TutorBitsTutorialRatingService extends TutorBitsBaseRatingService {
  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }
}

@Injectable()
export class TutorBitsConcreteTutorialRatingService extends TutorBitsTutorialRatingService {
  protected readonly basePath = `api/TutorialRating`;

  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }
}
