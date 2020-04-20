import { InjectionToken } from '@angular/core';

export interface ResponseWrapper<T> {
    error: any;
    data: T;
}

export enum Status {
    Undefined,
    Active,
    Inactive,
    Deleted
}

export interface IModelApiService<CreateModelT, UpdateModelT, ViewModelT> {
    Create(tutorial: CreateModelT): Promise<ResponseWrapper<ViewModelT>>;
    Update(tutorial: UpdateModelT): Promise<ResponseWrapper<ViewModelT>>;
    UpdateStatus(id: string, status: Status): Promise<boolean>;
    GetAll(status: Status): Promise<ViewModelT[]>;
    GetAllCached(status: Status): Promise<ViewModelT[]>;
    GetAllByOwner(status: Status): Promise<ViewModelT[]>;
    GetAllByOwnerCached(status: Status): Promise<ViewModelT[]>;
    Get(id: string): Promise<ViewModelT>;
    GetCached(id: string): Promise<ViewModelT>;
}
