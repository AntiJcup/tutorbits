import { InjectionToken } from '@angular/core';
import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';

export abstract class IPreviewService {
    public abstract async LoadPreview(
        projectId: string,
        offsetEnd: number): Promise<string>;

    public abstract async GeneratePreview(
        projectId: string,
        offsetEnd: number,
        logs: TraceTransactionLog[],
        baseProject?: string): Promise<string>;

    public abstract async DownloadPreview(
        projectId: string,
        offsetEnd: number,
        logs: TraceTransactionLog[],
        baseProject?: string): Promise<void>;
}