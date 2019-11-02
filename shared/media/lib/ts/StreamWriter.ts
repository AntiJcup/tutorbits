import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';

export abstract class StreamWriter {
    constructor(protected projectId: string) {

    }

    public abstract async StartUpload(): Promise<string>;
    public abstract async ContinueUpload(recordingId: string, data: Blob, part: number): Promise<boolean>;
    public abstract async FinishUpload(recordingId: string): Promise<string>;
}
