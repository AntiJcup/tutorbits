import { TutorBitsBaseModelApiService, HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IAPIService } from '../abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { CreateThumbnail } from 'src/app/models/thumbnail/create-thumbnail';
import { UpdateThumbnail } from 'src/app/models/thumbnail/update-thumbnail';
import { ViewThumbnail } from 'src/app/models/thumbnail/view-thumbnail';

// Import this as your service so tests can override it
export abstract class TutorBitsThumbnailService extends TutorBitsBaseModelApiService<CreateThumbnail, UpdateThumbnail, ViewThumbnail> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}

@Injectable()
export class TutorBitsConcreteThumbnailService extends TutorBitsThumbnailService {
  protected readonly basePath = `api/Thumbnail`;
  private multipartHeaders = {
    //'Content-Type': 'multipart/form-data'
  };

  protected async GetHeaders(handlerType: HandlerType): Promise<{ [key: string]: any }> {
    return { ...this.multipartHeaders };
  }

  protected async SerializeCreateBody(model: CreateThumbnail): Promise<any> {
    const formData = new FormData();
    formData.append('Thumbnail', model.thumbnail);
    return formData;
  }

  protected async SerializeUpdateBody(model: UpdateThumbnail): Promise<any> {
    const formData = new FormData();
    formData.append('thumbnail', model.thumbnail);
    return formData;
  }

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }
}
