export interface IStreamLoader {
    GetVideoStreamUrl(videoId: string, cacheBuster?: string): Promise<string>;
}
