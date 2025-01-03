import { IStreamWriter } from 'shared/media/lib/ts/IStreamWriter';
import { Part } from 'shared/media/lib/ts/Common';
import { TutorBitsBaseModelApiService } from './tutor-bits-base-model-api.service';
import { CreateVideo } from 'src/app/models/video/create-video';
import { UpdateVideo } from 'src/app/models/video/update-video';
import { ViewVideo } from 'src/app/models/video/view-video';
import { IStreamLoader } from 'shared/media/lib/ts/IStreamLoader';

export abstract class IVideoService
    extends TutorBitsBaseModelApiService<CreateVideo, UpdateVideo, ViewVideo>
    implements IStreamWriter, IStreamLoader {


    public async abstract StartUpload(videoId: string): Promise<string>;
    public async abstract ContinueUpload(videoId: string, recordingId: string, data: Blob, part: number, last: boolean): Promise<string>;
    public async abstract FinishUpload(videoId: string, recordingId: string, parts: Array<Part>): Promise<boolean>;
    public async abstract CheckStatus(videoId: string): Promise<string>;
    public async abstract GetVideoStreamUrl(videoId: string, cacheBuster?: string): Promise<string>;

    public abstract async Publish(videoId: string): Promise<boolean>;
}
