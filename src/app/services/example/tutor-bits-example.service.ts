import { ViewExample } from '../../models/example/view-example';
import { CreateExample } from '../../models/example/create-example';
import { TutorBitsBaseModelApiService, HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { UpdateExample } from '../../models/example/update-example';
import { CreateExampleForm } from 'src/app/models/example/create-example-form';
import { ICacheService } from '../abstract/ICacheService';

// Import this as your service so tests can override it
export abstract class TutorBitsExampleService extends TutorBitsBaseModelApiService<CreateExample, UpdateExample, ViewExample> {
  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }

  public abstract async Publish(exampleId: string): Promise<boolean>;
  public abstract async GetExampleTopics(): Promise<string[]>;
  public abstract ConvertForm(createExampleForm: CreateExampleForm): CreateExample;
}

@Injectable()
export class TutorBitsConcreteExampleService extends TutorBitsExampleService {
  protected readonly basePath = `api/Example`;

  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }

  public async Publish(exampleId: string): Promise<boolean> {
    const response = await this.requestService
      .Post(`${this.basePath}/Publish?exampleId=${exampleId}`, null, await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }

  public async GetExampleTopics(): Promise<string[]> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetProgrammingTopics`, await this.GetHeaders(HandlerType.Get));

    if (!response.ok) {
      throw new Error(`Failed getting example types: ${response.status}`);
    }

    return await response.json();
  }

  public ConvertForm(createExampleForm: CreateExampleForm): CreateExample {
    return {
      Title: createExampleForm.Title,
      Topic: createExampleForm.Topic,
      Description: createExampleForm.Description,
    } as CreateExample;
  }
}
