import { TutorBitsBaseModelApiService, HandlerType } from './tutor-bits-base-model-api.service';
import { IRequestService } from './IRequestService';
import { IAuthService } from './IAuthService';
import { Status } from './IModelApiService';
import { CreateRating } from 'src/app/models/rating/create-rating';
import { UpdateRating } from 'src/app/models/rating/update-rating';
import { ViewRating } from 'src/app/models/rating/view-rating';
import { ICacheService } from './ICacheService';

export abstract class TutorBitsBaseRatingService extends TutorBitsBaseModelApiService<CreateRating, UpdateRating, ViewRating> {
  constructor(requestService: IRequestService, auth: IAuthService, cache: ICacheService) {
    super(requestService, auth, cache);
  }

  public async GetScore(targetId: string, status: Status = Status.Active): Promise<number> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetScoreForTarget?state=${Status[status]}&targetId=${targetId}`,
        await this.GetHeaders(HandlerType.Get));

    if (!response.ok) {
      throw new Error('Failed retrieving score');
    }

    return (await response.json()) as number;
  }

  public async GetYourRatingForTarget(targetId: string): Promise<ViewRating> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetYourScoreForTarget?targetId=${targetId}`,
        await this.GetAuthHeaders(HandlerType.Get));

    if (!response.ok) {
      throw new Error('Failed retrieving your score');
    }

    return (await response.json()) as ViewRating;
  }
}

