import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { Part } from './StreamRecorder';

export abstract class StreamWriter {
    public abstract async StartUpload(projectId: string): Promise<string>;
    public abstract async ContinueUpload(projectId: string, recordingId: string, data: Blob, part: number, last: boolean): Promise<string>;
    public abstract async FinishUpload(projectId: string, recordingId: string, parts: Array<Part>): Promise<string>;
}
