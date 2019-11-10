import { editor } from 'monaco-editor';
import { StreamRecorder, StreamRecorderSettings } from 'shared/media/lib/ts/StreamRecorder';
import { StreamWriter } from 'shared/media/lib/ts/StreamWriter';
import { RecordingWebCamComponent } from '../recording-web-cam/recording-web-cam.component';

export class WebCamRecorder extends StreamRecorder {
    constructor(
        public webCam: RecordingWebCamComponent,
        writer: StreamWriter) {
        super(webCam.stream, writer, {
            minDataSize: 5242880,
            maxDataize: 52428800,
            minTimeBeforeUpload: 5000,
            mimeType: 'video/webm'
        } as StreamRecorderSettings);
    }
}
