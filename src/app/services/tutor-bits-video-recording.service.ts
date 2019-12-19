import { Injectable } from '@angular/core';
import { IAPIService } from './abstract/IAPIService';
import { IAuthService } from './abstract/IAuthService';
import { IVideoRecordingService } from './abstract/IVideoRecordingService';
import { Part } from 'shared/media/lib/ts/Common';

@Injectable()
export class TutorBitsVideoRecordingService extends IVideoRecordingService {
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: IAPIService, protected auth: IAuthService) {
    super();
  }

  protected async GetAuthHeaders(): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders, ...(await this.auth.getAuthHeader()) };
  }

  public async StartUpload(projectId: string): Promise<string> {
    const response = await this.apiService.generateRequest()
      .Post(`api/project/video/recording/start?projectId=${projectId}`, null, (await this.GetAuthHeaders()));

    if (!response.ok) {
      throw new Error('Failed start upload');
    }

    return await response.json();
  }

  public async ContinueUpload(projectId: string, recordingId: string, data: Blob, part: number, last: boolean): Promise<string> {
    const response = await this.apiService.generateRequest().Post(
      `api/project/video/recording/continue?projectId=${projectId}&recordingId=${recordingId}&part=${part}&last=${last}`, data,
      (await this.GetAuthHeaders()));

    if (!response.ok) {
      throw new Error('Failed continue upload');
    }

    return await response.json();
  }

  public async FinishUpload(projectId: string, recordingId: string, parts: Array<Part>): Promise<string> {
    const response = await this.apiService.generateRequest().Post(
      `api/project/video/recording/stop?projectId=${projectId}&recordingId=${recordingId}`, JSON.stringify(parts),
      (await this.GetAuthHeaders()));

    if (!response.ok) {
      throw new Error('Failed finish upload');
    }

    return await response.json();
  }

}
