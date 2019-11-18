import { StreamWriter } from './StreamWriter';
import { EventEmitter } from 'events';


export interface StreamRecorderSettings {
    minTimeBeforeUpload: number;
    minDataSize: number;
    maxDataize: number;
    mimeType: string;
}

export interface Part {
    index: number;
    etag: string;
}

export class StreamRecorder {
    private writeLoopInterval: any = null;
    protected mediaRecorder: MediaRecorder;
    protected pendingChunks: Array<Blob> = [];
    protected pendingDataSize = 0;
    protected recordingPart = 0;
    protected recordingId: string;
    private recording = false;
    private finishCallback: () => void = null;
    private writingReferences = 0;
    private sentParts: Array<Part> = [];

    constructor(
        protected stream: MediaStream,
        protected writer: StreamWriter,
        protected settings: StreamRecorderSettings,
        protected projectId: string) {
        this.mediaRecorder = new MediaRecorder(stream);
    }

    public async Initialize(): Promise<void> {

    }

    public async StartRecording() {
        this.pendingChunks = [];
        this.pendingDataSize = 0;
        this.recordingPart = 0;
        this.recording = true;
        this.writingReferences = 0;

        this.writeLoopInterval = setInterval(() => {
            this.WriteLoop();
        }, this.settings.minTimeBeforeUpload);

        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
            this.pendingChunks.push(e.data);
            this.pendingDataSize += e.data.size;

            if (!this.recording) {
                this.WriteLoop(true); // Force write remaining data and stop listening
                this.mediaRecorder.ondataavailable = null;
            }
        };

        this.recordingId = await this.writer.StartUpload(this.projectId);

        this.mediaRecorder.start(this.settings.minTimeBeforeUpload);
    }

    public async FinishRecording(): Promise<void> {
        this.recording = false;
        clearInterval(this.writeLoopInterval);
        this.mediaRecorder.stop();
        await new Promise<void>((resolve, reject) => {
            this.finishCallback = resolve;
        });

        await this.writer.FinishUpload(this.projectId, this.recordingId, this.sentParts);
    }

    public WriteLoop(force: boolean = false) {
        if (!force && this.pendingDataSize < this.settings.minDataSize) {
            return;
        }

        let combinedBlob = new Blob(this.pendingChunks, {
            type: this.settings.mimeType,
        });
        this.pendingChunks = [];

        while ((force && combinedBlob) || this.pendingDataSize >= this.settings.minDataSize) {
            const blobSize = Math.min(this.settings.maxDataize, combinedBlob.size);
            let uploadBlob = combinedBlob;
            if (blobSize !== combinedBlob.size) {
                uploadBlob = combinedBlob.slice(0, blobSize);
                combinedBlob = combinedBlob.slice(blobSize);
            } else {
                combinedBlob = null;
            }
            this.pendingDataSize -= blobSize;
            this.writingReferences++;
            this.writer.ContinueUpload(this.projectId, this.recordingId, uploadBlob, this.recordingPart, force).then((e: string) => {
                this.sentParts.push({ index: this.recordingPart++, etag: e });
                this.writingReferences--;
                if (this.writingReferences <= 0 && this.finishCallback) { // when done call finish callback
                    this.finishCallback();
                }
            });
        }

        if (combinedBlob && combinedBlob.size > 0) {
            this.pendingChunks = [combinedBlob];
        }
    }
}
