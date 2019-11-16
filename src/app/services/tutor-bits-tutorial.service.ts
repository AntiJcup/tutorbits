import { TutorBitsApiService } from './tutor-bits-api.service';
import { ViewTutorial } from '../models/tutorial/view-tutorial';
import { CreateTutorial } from '../models/tutorial/create-tutorial';
import { TutorBitsBaseModelApiService } from './abstract/tutor-bits-base-model-api.service';

export class TutorBitsTutorialService extends TutorBitsBaseModelApiService<CreateTutorial, ViewTutorial> {
  protected readonly basePath = `api/Tutorial`;

  constructor(apiService: TutorBitsApiService) {
    super(apiService);
  }
}
