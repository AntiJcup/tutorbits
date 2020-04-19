import { TutorBitsBaseModelApiService, HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IRequestService } from '../abstract/IRequestService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { CreateThumbnail } from 'src/app/models/thumbnail/create-thumbnail';
import { UpdateThumbnail } from 'src/app/models/thumbnail/update-thumbnail';
import { ViewThumbnail } from 'src/app/models/thumbnail/view-thumbnail';
import { ICacheService } from '../abstract/ICacheService';

// Import this as your service so tests can override it
export abstract class TutorBitsThumbnailService extends TutorBitsBaseModelApiService<CreateThumbnail, UpdateThumbnail, ViewThumbnail> {
  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }
}

@Injectable()
export class TutorBitsConcreteThumbnailService extends TutorBitsThumbnailService {
  protected readonly basePath = `api/Thumbnail`;
  private multipartHeaders = { // Excluded any header as it auto adds it with the form data
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

  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }
}
