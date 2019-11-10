import { Injectable } from '@angular/core';
import { TutorBitsApiService } from './tutor-bits-api.service';
import { ViewTutorial } from '../models/tutorial/view-tutorial';
import { CreateTutorial } from '../models/tutorial/create-tutorial';

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

@Injectable({
  providedIn: 'root'
})
export class TutorBitsTutorialService {
  private basePath = `api/Tutorial`;
  private baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: TutorBitsApiService) { }

  public async Create(tutorial: CreateTutorial): Promise<ResponseWrapper<ViewTutorial>> {
    const responseWrapper = { error: null, data: null } as ResponseWrapper<ViewTutorial>;
    const response = await this.apiService.generateRequest().Post(`${this.basePath}/Create`, JSON.stringify(tutorial), this.baseHeaders);

    if (!response.ok) {
      responseWrapper.error = await response.json();
      return responseWrapper;
    }

    responseWrapper.data = await response.json() as ViewTutorial;
    return responseWrapper;
  }

  public async UpdateStatus(tutorialId: string, status: Status): Promise<boolean> {
    const response =
      await this.apiService.generateRequest().Post(
        `${this.basePath}/UpdateStatusById?id=${tutorialId}&status=${Status[status]}`,
        null,
        this.baseHeaders);

    return response.ok;
  }

  public async GetAll(status: Status = Status.Active): Promise<ViewTutorial[]> {
    const response = await this.apiService.generateRequest().Get(`${this.basePath}/GetAll?state=${Status[status]}`);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ViewTutorial[];
  }
}
