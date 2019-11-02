import { StreamWriter } from './StreamWriter';


export interface StreamRecorderSettings {
    minTimeBeforeUpload: number;
    minChunkSize: number;
    maxChunkSize: number;
    mimeType: string;
}


export class StreamRecorder {
    private writeLoopInterval: any = null;
    protected mediaRecorder: MediaRecorder;
    constructor(
        protected stream: MediaStream,
        protected writer: StreamWriter,
        protected settings: StreamRecorderSettings) {
            this.mediaRecorder = new MediaRecorder(stream);
    }

    public async Initialize(): Promise<void> {

    }

    public async StartRecording() {
        this.writeLoopInterval = setInterval(() => {
            this.WriteLoop();
        }, this.settings.minTimeBeforeUpload);
    }

    public async FinishRecording() {
        clearInterval(this.writeLoopInterval);
    }

    public WriteLoop() {

    }
}
