import { TutorBitsBaseModelApiService } from './tutor-bits-base-model-api.service';
import { IAPIService } from './IAPIService';
import { IAuthService } from './IAuthService';
import { Status } from './IModelApiService';
import { CreateRating } from 'src/app/models/rating/create-rating';
import { UpdateRating } from 'src/app/models/rating/update-rating';
import { ViewRating } from 'src/app/models/rating/view-rating';

export abstract class TutorBitsBaseRatingService extends TutorBitsBaseModelApiService<CreateRating, UpdateRating, ViewRating> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public async GetScore(targetId: string, status: Status = Status.Active): Promise<number> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetScoreForTarget?state=${Status[status]}&targetId=${targetId}`,
        await this.GetHeaders());

    if (!response.ok) {
      throw new Error('Failed retrieving score');
    }

    return (await response.json()) as number;
  }

  public async GetYourRatingForTarget(targetId: string): Promise<ViewRating> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetYourScoreForTarget?targetId=${targetId}`,
        await this.GetAuthHeaders());

    if (!response.ok) {
      throw new Error('Failed retrieving your score');
    }

    return (await response.json()) as ViewRating;
  }
}

