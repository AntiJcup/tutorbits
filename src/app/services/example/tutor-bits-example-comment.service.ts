import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { TutorBitsBaseCommentService } from '../abstract/tutor-bits-base-comment.service';
import { ICacheService } from '../abstract/ICacheService';

// Import this as your service so tests can override it
export abstract class TutorBitsExampleCommentService extends TutorBitsBaseCommentService {
  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }
}

@Injectable()
export class TutorBitsConcreteExampleCommentService extends TutorBitsExampleCommentService {
  protected readonly basePath = `api/ExampleComment`;

  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }
}
