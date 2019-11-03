import { StreamLoader } from './StreamLoader';
import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';

export class OnlineStreamLoader extends StreamLoader {

    constructor(protected projectId: string, protected requestor: ApiHttpRequest) {
        super(projectId);
    }

    public async GetVideoStreamUrl(): Promise<string> {
        const response = await this.requestor.Get(`api/project/video/streaming/video?projectId=${this.projectId}`);
        if (!response.ok) {
            return null;
        }

        return await response.json();
    }
}