import { StreamWriter } from './StreamWriter';


export interface StreamRecorderSettings {
    minTimeBeforeUpload: number;
    minDataSize: number;
    maxDataize: number;
    mimeType: string;
}


export class StreamRecorder {
    private writeLoopInterval: any = null;
    protected mediaRecorder: MediaRecorder;
    protected pendingChunks: Array<Blob> = [];
    protected pendingDataSize = 0;
    protected recordingPart = 0;
    protected recordingId: string;

    constructor(
        protected stream: MediaStream,
        protected writer: StreamWriter,
        protected settings: StreamRecorderSettings) {
        this.mediaRecorder = new MediaRecorder(stream);
    }

    public async Initialize(): Promise<void> {

    }

    public async StartRecording() {
        this.pendingChunks = [];
        this.pendingDataSize = 0;
        this.recordingPart = 0;

        this.writeLoopInterval = setInterval(() => {
            this.WriteLoop();
        }, this.settings.minTimeBeforeUpload);

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
            this.pendingChunks.push(e.data);
            this.pendingDataSize += e.data.size;
        };

        this.recordingId = await this.writer.StartUpload();

        this.mediaRecorder.start();
    }

    public async FinishRecording() {
        clearInterval(this.writeLoopInterval);
        this.mediaRecorder.stop();
        this.WriteLoop(true);
        await this.writer.FinishUpload();
    }

    public WriteLoop(force: boolean = false) {
        if (!force && this.pendingDataSize < this.settings.minDataSize) {
            return;
        }

        let combinedBlob = new Blob(this.pendingChunks, {
            type: this.settings.mimeType,
        });

        while (force || this.pendingDataSize >= this.settings.minDataSize) {
            const blobSize = Math.min(this.settings.maxDataize, combinedBlob.size);
            let uploadBlob = combinedBlob;
            if (blobSize !== combinedBlob.size) {
                uploadBlob = combinedBlob.slice(0, blobSize);
                combinedBlob = combinedBlob.slice(blobSize);
            } else {
                combinedBlob = null;
            }
            this.pendingDataSize -= blobSize;
            this.writer.ContinueUpload(this.recordingId, uploadBlob, this.recordingPart++);
        }

        if (combinedBlob && combinedBlob.size > 0) {
            this.pendingChunks = [combinedBlob];
        }
    }
}
