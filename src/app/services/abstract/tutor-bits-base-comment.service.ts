import { TutorBitsBaseModelApiService } from './tutor-bits-base-model-api.service';
import { IAPIService } from './IAPIService';
import { IAuthService } from './IAuthService';
import { ViewComment } from '../../models/comment/view-comment';
import { CreateComment } from 'src/app/models/comment/create-comment';
import { UpdateComment } from 'src/app/models/comment/update-comment';
import { Status } from './IModelApiService';

export abstract class TutorBitsBaseCommentService extends TutorBitsBaseModelApiService<CreateComment, UpdateComment, ViewComment> {
  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public async GetComments(targetId: string, status: Status = Status.Active, take: number = null, skip: number = null): Promise<ViewComment[]> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetCommentsForTarget?state=${Status[status]}&targetId=${targetId}${take === null ? '' : `&take=${take}`}${skip === null ? '' : `&skip=${skip}`}`,
        await this.GetHeaders());

    if (!response.ok) {
      throw new Error('Failed retrieving comments');
    }

    return (await response.json()) as ViewComment[];
  }

  public async GetCommentCount(targetId: string, status: Status = Status.Active): Promise<number> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetCountForTarget?state=${Status[status]}&targetId=${targetId}`,
        await this.GetHeaders());

    if (!response.ok) {
      throw new Error('Failed retrieving comment count');
    }

    return (await response.json()) as number;
  }
}

