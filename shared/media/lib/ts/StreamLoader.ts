export abstract class StreamLoader {
    constructor(protected projectId: string) {
    }

    public abstract GetVideoStreamUrl(): Promise<string>;
}
