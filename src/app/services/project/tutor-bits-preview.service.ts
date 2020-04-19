import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ILogService } from '../abstract/ILogService';
import { IPreviewService } from '../abstract/IPreviewService';
import { OnlinePreviewGenerator } from 'shared/Tracer/lib/ts/OnlinePreviewGenerator';
import { IRequestService } from '../abstract/IRequestService';
import { TraceTransactionLogs, TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';

@Injectable()
export class TutorBitsPreviewService extends IPreviewService {
  constructor(protected requestService: IRequestService) { super(); }

  public async LoadPreview(projectId: string, offsetEnd: number): Promise<string> {
    const response = await this.requestService
      .Get(`api/project/preview/load?projectId=${projectId}&offsetEnd=${offsetEnd}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  public async GeneratePreview(projectId: string, offsetEnd: number, logs: TraceTransactionLog[], baseProject?: string): Promise<string> {
    const uploadLogs: TraceTransactionLogs = new TraceTransactionLogs();
    uploadLogs.setLogsList(logs);
    const buffer = uploadLogs.serializeBinary();
    const response = await this.requestService
      .Post(`api/project/preview/generate?projectId=${projectId}&offsetEnd=${offsetEnd}${baseProject ? `&baseProjectId=${baseProject}` : ''}`,
        new Blob([buffer]));

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  public async DownloadPreview(projectId: string, offsetEnd: number, logs: TraceTransactionLog[], baseProject?: string): Promise<void> {
    const uploadLogs: TraceTransactionLogs = new TraceTransactionLogs();
    uploadLogs.setLogsList(logs);
    const buffer = uploadLogs.serializeBinary();
    const response = await this.requestService
      // tslint:disable-next-line: max-line-length
      .Post(`api/project/preview/download?projectId=${projectId}&offsetEnd=${offsetEnd}${baseProject ? `&baseProjectId=${baseProject}` : ''}`,
        new Blob([buffer]));

    if (!response.ok) {
      throw new Error('Failed generating download url for preview');
    }

    const downloadUrl = await response.json();
    if (!downloadUrl) {
      throw new Error('Bad download url for preview');
    }

    const downloadFrame = document.createElement('iframe');
    downloadFrame.style.display = 'none';
    downloadFrame.src = downloadUrl;
    document.body.appendChild(downloadFrame);
  }
}
