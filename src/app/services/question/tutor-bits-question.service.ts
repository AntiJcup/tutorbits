import { ViewQuestion } from '../../models/question/view-question';
import { CreateQuestion } from '../../models/question/create-question';
import { TutorBitsBaseModelApiService, HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { UpdateQuestion } from '../../models/question/update-question';
import { CreateQuestionForm } from 'src/app/models/question/create-question-form';

// Import this as your service so tests can override it
export abstract class TutorBitsQuestionService extends TutorBitsBaseModelApiService<CreateQuestion, UpdateQuestion, ViewQuestion> {
  constructor(requestService: IRequestService, auth: IAuthService) {
    super(requestService, auth);
  }

  public abstract async Publish(questionId: string): Promise<boolean>;
  public abstract async GetQuestionTopics(): Promise<string[]>;
  public abstract ConvertForm(createQuestionForm: CreateQuestionForm): CreateQuestion;
}

@Injectable()
export class TutorBitsConcreteQuestionService extends TutorBitsQuestionService {
  protected readonly basePath = `api/Question`;

  constructor(requestService: IRequestService, auth: IAuthService) {
    super(requestService, auth);
  }

  public async Publish(questionId: string): Promise<boolean> {
    const response = await this.requestService
      .Post(`${this.basePath}/Publish?questionId=${questionId}`, null, await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }

  public async GetQuestionTopics(): Promise<string[]> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetProgrammingTopics`, await this.GetHeaders(HandlerType.Get));

    if (!response.ok) {
      throw new Error(`Failed getting question types: ${response.status}`);
    }

    return await response.json();
  }

  public ConvertForm(createQuestionForm: CreateQuestionForm): CreateQuestion {
    return {
      Title: createQuestionForm.Title,
      Topic: createQuestionForm.Topic,
      Description: createQuestionForm.Description,
    } as CreateQuestion;
  }
}
