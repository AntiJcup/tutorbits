import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';
import { StreamWriter } from './StreamWriter';
import { Part } from './StreamRecorder';

export class OnlineStreamWriter extends StreamWriter {
    constructor(protected projectId: string, protected requestor: ApiHttpRequest) {
        super(projectId);
    }

    public async StartUpload(): Promise<string> {
        const response = await this.requestor.Post(`api/project/video/recording/start?projectId=${this.projectId}`);
        if (!response.ok) {
            return null;
        }

        return await response.json();
    }

    public async ContinueUpload(recordingId: string, data: Blob, part: number, last: boolean): Promise<string> {
        const response = await this.requestor.Post(
            `api/project/video/recording/continue?projectId=${this.projectId}&recordingId=${recordingId}&part=${part}&last=${last}`, data);

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }

    public async FinishUpload(recordingId: string, parts: Array<Part>): Promise<string> {
        const response = await this.requestor.Post(
            `api/project/video/recording/stop?projectId=${this.projectId}&recordingId=${recordingId}`, JSON.stringify(parts),
            { 'Content-Type': 'application/json' });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }

}
