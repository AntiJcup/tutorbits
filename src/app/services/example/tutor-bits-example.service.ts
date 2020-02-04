import { ViewExample } from '../../models/example/view-example';
import { CreateExample } from '../../models/example/create-example';
import { TutorBitsBaseModelApiService, HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IAPIService } from '../abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { UpdateExample } from '../../models/example/update-example';
import { CreateExampleForm } from 'src/app/models/example/create-example-form';

// Import this as your service so tests can override it
export abstract class TutorBitsExampleService extends TutorBitsBaseModelApiService<CreateExample, UpdateExample, ViewExample> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public abstract async Publish(exampleId: string): Promise<boolean>;
  public abstract async GetExampleTopics(): Promise<string[]>;
  public abstract ConvertForm(createExampleForm: CreateExampleForm): CreateExample;
}

@Injectable()
export class TutorBitsConcreteExampleService extends TutorBitsExampleService {
  protected readonly basePath = `api/Example`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public async Publish(exampleId: string): Promise<boolean> {
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/Publish?exampleId=${exampleId}`, null, await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }

  public async GetExampleTopics(): Promise<string[]> {
    const response = await this.apiService.generateRequest()
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
