import { IModelApiService, ResponseWrapper, Status } from './IModelApiService';
import { IRequestService } from './IRequestService';
import { IAuthService } from './IAuthService';

export enum HandlerType {
  Create,
  Update,
  Delete,
  Get,
  GetAll,
  GetOwner
}

export abstract class TutorBitsBaseModelApiService<CreateModelT, UpdateModelT, ViewModelT>
  implements IModelApiService<CreateModelT, UpdateModelT, ViewModelT> {
  protected abstract readonly basePath: string;
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected requestService: IRequestService, protected auth: IAuthService) { }

  protected async GetHeaders(handlerType: HandlerType): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders };
  }

  protected async GetAuthHeaders(handlerType: HandlerType): Promise<{ [key: string]: any }> {
    return { ...(await this.GetHeaders(handlerType)), ...(await this.auth.getAuthHeader()) };
  }

  protected async SerializeCreateBody(model: CreateModelT): Promise<any> {
    return JSON.stringify(model);
  }

  protected async SerializeUpdateBody(model: UpdateModelT): Promise<any> {
    return JSON.stringify(model);
  }

  public async Create(model: CreateModelT): Promise<ResponseWrapper<ViewModelT>> {
    const responseWrapper = { error: null, data: null } as ResponseWrapper<ViewModelT>;
    const response = await this.requestService
      .Post(`${this.basePath}/Create`, await this.SerializeCreateBody(model), await this.GetAuthHeaders(HandlerType.Create));

    if (!response.ok) {
      responseWrapper.error = await response.json();
      return responseWrapper;
    }

    responseWrapper.data = await response.json() as ViewModelT;
    return responseWrapper;
  }

  public async Update(model: UpdateModelT): Promise<ResponseWrapper<ViewModelT>> {
    const responseWrapper = { error: null, data: null } as ResponseWrapper<ViewModelT>;
    const response = await this.requestService
      .Post(`${this.basePath}/Update`, await this.SerializeUpdateBody(model), await this.GetAuthHeaders(HandlerType.Update));

    if (!response.ok) {
      responseWrapper.error = await response.json();
      return responseWrapper;
    }

    responseWrapper.data = await response.json() as ViewModelT;
    return responseWrapper;
  }

  public async UpdateStatus(id: string, status: Status): Promise<boolean> {
    const response =
      await this.requestService.Post(
        `${this.basePath}/UpdateStatusById?id=${id}&status=${Status[status]}`,
        null,
        await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }

  public async GetAll(status: Status = Status.Active, take: number = null, skip: number = null): Promise<ViewModelT[]> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetAll?state=${Status[status]}${take === null ? '' : `&take=${take}`}${skip === null ? '' : `&skip=${skip}`}`,
        await this.GetHeaders(HandlerType.GetAll));

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewModelT[];
  }

  public async GetAllByOwner(take: number = null, skip: number = null): Promise<ViewModelT[]> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetAllByOwner${take === null ? '' : `?take=${take}`}${skip === null ? '' : `${take === null ? '?' : '&'}skip=${skip}`}`,
        await this.GetAuthHeaders(HandlerType.GetOwner));

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewModelT[];
  }

  public async Delete(id: string): Promise<boolean> {
    const response =
      await this.requestService.Post(
        `${this.basePath}/DeleteById?id=${id}`,
        null,
        await this.GetAuthHeaders(HandlerType.Delete));

    return response.ok;
  }

  public async Get(id: string): Promise<ViewModelT> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetById?id=${id}`,
        await this.GetHeaders(HandlerType.Get));

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewModelT;
  }
}
