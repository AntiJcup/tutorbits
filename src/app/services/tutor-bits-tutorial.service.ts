import { ViewTutorial } from '../models/tutorial/view-tutorial';
import { CreateTutorial } from '../models/tutorial/create-tutorial';
import { TutorBitsBaseModelApiService } from './abstract/tutor-bits-base-model-api.service';
import { IAPIService } from './abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from './abstract/IAuthService';
import { FileUtils } from 'shared/web/lib/ts/FileUtils';
import { UpdateTutorial } from '../models/tutorial/update-tutorial';

// Import this as your service so tests can override it
export abstract class TutorBitsTutorialService extends TutorBitsBaseModelApiService<CreateTutorial, UpdateTutorial, ViewTutorial> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public abstract async UploadThumbnail(thumbnail: File, tutorialId: string): Promise<void>;
  public abstract async Publish(tutorialId: string): Promise<boolean>;
  public abstract async GetTutorialLanguages(): Promise<string[]>;
}

@Injectable()
export class TutorBitsConcreteTutorialService extends TutorBitsTutorialService {
  protected readonly basePath = `api/Tutorial`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public async UploadThumbnail(thumbnail: File, tutorialId: string): Promise<void> {
    const response = await this.apiService.generateRequest()
      .Post(`api/Thumbnail/Upload?tutorialId=${tutorialId}`, await FileUtils.FileToBlob(thumbnail), await this.GetAuthHeaders());

    if (!response.ok) {
      throw new Error('Failed uploading thumbnail');
    }
  }

  public async Publish(tutorialId: string): Promise<boolean> {
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/Publish?tutorialId=${tutorialId}`, null, await this.GetAuthHeaders());

    return response.ok;
  }

  public async GetTutorialLanguages(): Promise<string[]> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetTutorialTopics`, await this.GetAuthHeaders());

    if (!response.ok) {
      throw new Error(`Failed getting tutorial types: ${response.status}`);
    }

    return await response.json();
  }
}
