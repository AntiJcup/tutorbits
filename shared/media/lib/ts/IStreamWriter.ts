import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { Part } from './StreamRecorder';

export interface IStreamWriter {
    StartUpload(projectId: string): Promise<string>;
    ContinueUpload(projectId: string, recordingId: string, data: Blob, part: number, last: boolean): Promise<string>;
    FinishUpload(projectId: string, recordingId: string, parts: Array<Part>): Promise<boolean>;
    CheckStatus(projectId: string): Promise<string>;
}
