import { HandlerType } from '../abstract/tutor-bits-base-model-api.service';
import { IAPIService } from '../abstract/IAPIService';
import { Injectable } from '@angular/core';
import { IAuthService } from '../abstract/IAuthService';
import { Part } from 'shared/media/lib/ts/Common';
import { IVideoService } from '../abstract/IVideoService';


@Injectable()
export class TutorBitsVideoService extends IVideoService {
  protected readonly basePath = `api/Video`;

  constructor(apiService: IAPIService, auth: IAuthService) {
    super(apiService, auth);
  }

  public async StartUpload(videoId: string): Promise<string> {
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/start?videoId=${videoId}`, null, (await this.GetAuthHeaders(HandlerType.Create)));

    if (!response.ok) {
      throw new Error('Failed start upload');
    }

    return await response.json();
  }

  public async ContinueUpload(videoId: string, recordingId: string, data: Blob, part: number, last: boolean): Promise<string> {
    const response = await this.apiService.generateRequest().Post(
      `${this.basePath}/continue?videoId=${videoId}&recordingId=${recordingId}&part=${part}&last=${last}`, data,
      (await this.GetAuthHeaders(HandlerType.Create)));

    if (!response.ok) {
      throw new Error('Failed continue upload');
    }

    return await response.json();
  }

  public async FinishUpload(videoId: string, recordingId: string, parts: Array<Part>): Promise<boolean> {
    const response = await this.apiService.generateRequest().Post(
      `${this.basePath}/stop?videoId=${videoId}&recordingId=${recordingId}`, JSON.stringify(parts),
      (await this.GetAuthHeaders(HandlerType.Create)));

    if (!response.ok) {
      throw new Error('Failed finish upload');
    }

    return true;
  }

  public async CheckStatus(videoId: string): Promise<string> {
    const response = await this.apiService.generateRequest().Get(
      `${this.basePath}/status?videoId=${videoId}`,
      (await this.GetAuthHeaders(HandlerType.Get)));

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    return await response.json();
  }

  public async GetVideoStreamUrl(videoId: string, cacheBuster?: string): Promise<string> {
    const response = await this.apiService.generateRequest().Get(`${this.basePath}/video?videoId=${videoId}`);
    if (!response.ok) {
      return null;
    }

    return `${await response.json()}${cacheBuster === null ? '' : `?cb=${cacheBuster}`}`;
  }

  public async Publish(videoId: string): Promise<boolean> {
    const response = await this.apiService.generateRequest()
      .Post(`${this.basePath}/Publish?videoId=${videoId}`, null, await this.GetAuthHeaders(HandlerType.Update));

    return response.ok;
  }
}
