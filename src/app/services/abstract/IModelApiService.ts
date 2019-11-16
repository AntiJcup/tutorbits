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

export interface IModelApiService<CreateModelT, ViewModelT> {
    Create(tutorial: CreateModelT): Promise<ResponseWrapper<ViewModelT>>;
    UpdateStatus(id: string, status: Status): Promise<boolean>;
    GetAll(status: Status): Promise<ViewModelT[]>;
}
