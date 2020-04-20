import { IModelApiService, ResponseWrapper, Status } from './IModelApiService';
import { IRequestService } from './IRequestService';
import { IAuthService } from './IAuthService';
import { ICacheService } from './ICacheService';

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

  constructor(protected requestService: IRequestService, protected auth: IAuthService, protected cache: ICacheService) { }

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

    this.cache.ClearCache();

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

    this.cache.ClearCache();

    responseWrapper.data = await response.json() as ViewModelT;
    return responseWrapper;
  }

  public async UpdateStatus(id: string, status: Status): Promise<boolean> {
    const response =
      await this.requestService.Post(
        `${this.basePath}/UpdateStatusById?id=${id}&status=${Status[status]}`,
        null,
        await this.GetAuthHeaders(HandlerType.Update));

    this.cache.ClearCache();
    return response.ok;
  }

  public async GetAll(status: Status = Status.Active, take: number = null, skip: number = null): Promise<ViewModelT[]> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetAll?state=${Status[status]}${!take ? '' : `&take=${take}`}${!skip ? '' : `&skip=${skip}`}`,
        await this.GetHeaders(HandlerType.GetAll));

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewModelT[];
  }

  public async GetAllCached(status: Status = Status.Active, take: number = null, skip: number = null): Promise<ViewModelT[]> {
    return await this.cache.CacheFunc(this.GetAll, this, status, take, skip);
  }

  public async GetAllByOwner(take: number = null, skip: number = null): Promise<ViewModelT[]> {
    const response = await this.requestService
      .Get(`${this.basePath}/GetAllByOwner${!take ? '' : `?take=${take}`}${!skip ? '' : `${!take ? '?' : '&'}skip=${skip}`}`,
        await this.GetAuthHeaders(HandlerType.GetOwner));

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewModelT[];
  }

  public async GetAllByOwnerCached(take: number = null, skip: number = null): Promise<ViewModelT[]> {
    return await this.cache.CacheFunc(this.GetAllByOwner, this, take, skip);
  }

  public async Delete(id: string): Promise<boolean> {
    const response =
      await this.requestService.Post(
        `${this.basePath}/DeleteById?id=${id}`,
        null,
        await this.GetAuthHeaders(HandlerType.Delete));

    this.cache.ClearCache();
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

  public async GetCached(id: string): Promise<ViewModelT> {
    return this.cache.CacheFunc(this.Get, this, id);
  }
}
