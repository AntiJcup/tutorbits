import { StreamRecorder, StreamRecorderSettings } from 'shared/media/lib/ts/StreamRecorder';
import { IStreamWriter } from 'shared/media/lib/ts/IStreamWriter';
import { RecordingWebCamComponent } from '../recording-web-cam/recording-web-cam.component';

export class WebCamRecorder extends StreamRecorder {
    constructor(
        public webCam: RecordingWebCamComponent,
        writer: IStreamWriter,
        projectId: string) {
        super(webCam.stream, writer, {
            minDataSize: 5242880,
            maxDataize: 52428800,
            minTimeBeforeUpload: 5000,
            mimeType: 'video/webm'
        } as StreamRecorderSettings,
            projectId);
    }
}
