import { TutorBitsBaseModelApiService } from '../abstract/tutor-bits-base-model-api.service';
import { IAPIService } from '../abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { CreateAccount } from '../../models/user/create-account';
import { ViewAccount } from '../../models/user/view-account';
import { UpdateAccount } from '../../models/user/update-account';
import { TutorBitsBaseCommentService } from '../abstract/tutor-bits-base-comment.service';

// Import this as your service so tests can override it
export abstract class TutorBitsQuestionCommentService extends TutorBitsBaseCommentService {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}

@Injectable()
export class TutorBitsConcreteQuestionCommentService extends TutorBitsQuestionCommentService {
  protected readonly basePath = `api/QuestionComment`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}
