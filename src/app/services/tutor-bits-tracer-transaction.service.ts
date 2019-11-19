import { Injectable } from '@angular/core';
import { IAPIService } from './abstract/IAPIService';
import { IAuthService } from './abstract/IAuthService';
import { ITracerTransactionService } from './abstract/ITracerTransactionService';
import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';

@Injectable()
export class TutorBitsTracerTransactionService extends ITracerTransactionService {
  protected baseHeaders = {
    'Content-Type': 'application/json'
  };

  constructor(protected apiService: IAPIService, protected auth: IAuthService) {
    super();
  }

  protected async GetAuthHeaders(): Promise<{ [key: string]: any }> {
    return { ...this.baseHeaders, ...(await this.auth.getAuthHeader()) };
  }

  protected async WriteTransactionLog(transactionLog: TraceTransactionLog, data: Uint8Array, projectId: string): Promise<boolean> {
    const response = await this.apiService.generateRequest().Post(`api/project/recording/add?projectId=${projectId}`,
      new Blob([data]), (await this.GetAuthHeaders()));

    return response.ok;
  }
}