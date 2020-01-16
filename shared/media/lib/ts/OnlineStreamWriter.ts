import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { StreamWriter } from './StreamWriter';
import { Part } from './StreamRecorder';
import { TutorBitsErrorService } from 'src/app/services/logging/tutor-bits-error.service';

export class OnlineStreamWriter extends StreamWriter {
    constructor(protected requestor: ApiHttpRequest) {
        super();
    }

    public async StartUpload(projectId: string): Promise<string> {
        const response = await this.requestor.Post(`api/project/video/recording/start?projectId=${projectId}`);
        if (!response.ok) {
            throw new Error('Failed starting upload');
        }

        return await response.json();
    }

    public async ContinueUpload(projectId: string, recordingId: string, data: Blob, part: number, last: boolean): Promise<string> {
        const response = await this.requestor.Post(
            `api/project/video/recording/continue?projectId=${projectId}&recordingId=${recordingId}&part=${part}&last=${last}`, data);

        if (!response.ok) {
            throw new Error('Failed upload part');
        }

        return await response.json();
    }

    public async FinishUpload(projectId: string, recordingId: string, parts: Array<Part>): Promise<boolean> {
        const response = await this.requestor.Post(
            `api/project/video/recording/stop?projectId=${projectId}&recordingId=${recordingId}`, JSON.stringify(parts),
            { 'Content-Type': 'application/json' });

        if (!response.ok) {
            throw new Error('Failed finish upload');
        }

        return true;
    }


    public async CheckStatus(projectId: string): Promise<string> {
        const response = await this.requestor.Get(
            `api/project/video/recording/status?projectId=${projectId}`,
            { 'Content-Type': 'application/json' });

        if (!response.ok) {
            throw new Error('Failed to check status');
        }

        return await response.json();
    }

}
