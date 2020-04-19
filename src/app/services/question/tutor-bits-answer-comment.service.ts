import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { TutorBitsBaseCommentService } from '../abstract/tutor-bits-base-comment.service';

// Import this as your service so tests can override it
export abstract class TutorBitsAnswerCommentService extends TutorBitsBaseCommentService {
  constructor(requestService: IRequestService, auth: IAuthService) {
    super(requestService, auth);
  }
}

@Injectable()
export class TutorBitsConcreteAnswerCommentService extends TutorBitsAnswerCommentService {
  protected readonly basePath = `api/AnswerComment`;

  constructor(requestService: IRequestService, auth: IAuthService) {
    super(requestService, auth);
  }
}
