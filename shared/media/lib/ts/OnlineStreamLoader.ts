import { IStreamLoader } from './IStreamLoader';
import { ApiHttpRequest } from 'shared/web/lib/ts/ApiHttpRequest';

export class OnlineStreamLoader implements IStreamLoader {

    constructor(protected projectId: string, protected requestor: ApiHttpRequest, protected cacheBuster: string = null) {
    }

    public async GetVideoStreamUrl(videoId: string, cacheBuster?: string): Promise<string> {
        const response = await this.requestor.Get(`api/project/video/streaming/video?videoId=${videoId}`);
        if (!response.ok) {
            return null;
        }

        return `${await response.json()}${cacheBuster === null ? '' : `?cb=${cacheBuster}`}`;
    }
}