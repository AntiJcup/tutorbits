import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { Part } from './StreamRecorder';

export abstract class StreamWriter {
    constructor(protected projectId: string) {

    }

    public abstract async StartUpload(): Promise<string>;
    public abstract async ContinueUpload(recordingId: string, data: Blob, part: number, last: boolean): Promise<string>;
    public abstract async FinishUpload(recordingId: string, parts: Array<Part>): Promise<string>;
}
