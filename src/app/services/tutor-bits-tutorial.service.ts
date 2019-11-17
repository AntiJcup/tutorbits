import { TutorBitsApiService } from './tutor-bits-api.service';
import { ViewTutorial } from '../models/tutorial/view-tutorial';
import { CreateTutorial } from '../models/tutorial/create-tutorial';
import { TutorBitsBaseModelApiService } from './abstract/tutor-bits-base-model-api.service';
import { IAPIService } from './abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from './abstract/IAuthService';

// Import this as your service so tests can override it
export abstract class TutorBitsTutorialService extends TutorBitsBaseModelApiService<CreateTutorial, ViewTutorial> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}

@Injectable()
export class TutorBitsConcreteTutorialService extends TutorBitsTutorialService {
  protected readonly basePath = `api/Tutorial`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}
