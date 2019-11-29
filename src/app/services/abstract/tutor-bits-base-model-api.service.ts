import { TutorBitsApiService } from '../tutor-bits-api.service';
import { IModelApiService, ResponseWrapper, Status } from './IModelApiService';
import { IAPIService } from './IAPIService';
import { IAuthService } from './IAuthService';

export abstract class TutorBitsBaseModelApiService<CreateModelT, ViewModelT> implements IModelApiService<CreateModelT, ViewModelT> {
  protected abstract readonly basePath: string;
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: IAPIService, protected auth: IAuthService) { }

  protected async GetHeaders(): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders };
  }

  protected async GetAuthHeaders(): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders, ...(await this.auth.getAuthHeader()) };
  }

  public async Create(tutorial: CreateModelT): Promise<ResponseWrapper<ViewModelT>> {
    const responseWrapper = { error: null, data: null } as ResponseWrapper<ViewModelT>;
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/Create`, JSON.stringify(tutorial), await this.GetAuthHeaders());

    if (!response.ok) {
      responseWrapper.error = await response.json();
      return responseWrapper;
    }

    responseWrapper.data = await response.json() as ViewModelT;
    return responseWrapper;
  }

  public async UpdateStatus(id: string, status: Status): Promise<boolean> {
    const response =
      await this.apiService.generateRequest().Post(
        `${this.basePath}/UpdateStatusById?id=${id}&status=${Status[status]}`,
        null,
        await this.GetAuthHeaders());

    return response.ok;
  }

  public async GetAll(status: Status = Status.Active): Promise<ViewModelT[]> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetAll?state=${Status[status]}`, await this.GetHeaders());

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewModelT[];
  }

  public async GetAllByOwner(): Promise<ViewModelT[]> {
    const response = await this.apiService.generateRequest()
      .Get(`${this.basePath}/GetAllByOwner?state=${Status[status]}`,
        await this.GetAuthHeaders());

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewModelT[];
  }

  public async Delete(id: string): Promise<boolean> {
    const response =
      await this.apiService.generateRequest().Post(
        `${this.basePath}/DeleteById?id=${id}`,
        null,
        await this.GetAuthHeaders());

    return response.ok;
  }
}
