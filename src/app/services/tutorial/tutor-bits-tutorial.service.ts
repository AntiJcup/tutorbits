import { ViewTutorial } from '../../models/tutorial/view-tutorial';
import { CreateTutorial } from '../../models/tutorial/create-tutorial';
import { TutorBitsBaseModelApiService, HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IAPIService } from '../abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { FileUtils } from 'shared/web/lib/ts/FileUtils';
import { UpdateTutorial } from '../../models/tutorial/update-tutorial';
import { CreateTutorialForm } from 'src/app/models/tutorial/create-tutorial-form';

// Import this as your service so tests can override it
export abstract class TutorBitsTutorialService extends TutorBitsBaseModelApiService<CreateTutorial, UpdateTutorial, ViewTutorial> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public abstract async Publish(tutorialId: string): Promise<boolean>;
  public abstract async GetTutorialTopics(): Promise<string[]>;
  public abstract ConvertForm(createTutorialForm: CreateTutorialForm): CreateTutorial;
}

@Injectable()
export class TutorBitsConcreteTutorialService extends TutorBitsTutorialService {
  protected readonly basePath = `api/Tutorial`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public async Publish(tutorialId: string): Promise<boolean> {
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/Publish?tutorialId=${tutorialId}`, null, await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }

  public async GetTutorialTopics(): Promise<string[]> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetProgrammingTopics`, await this.GetHeaders(HandlerType.Get));

    if (!response.ok) {
      throw new Error(`Failed getting tutorial types: ${response.status}`);
    }

    return await response.json();
  }

  public ConvertForm(createTutorialForm: CreateTutorialForm): CreateTutorial {
    return {
      Title: createTutorialForm.Title,
      Topic: createTutorialForm.Topic,
      Description: createTutorialForm.Description,
    } as CreateTutorial;
  }
}
