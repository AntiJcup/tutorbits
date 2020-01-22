import { IStreamLoader } from 'shared/media/lib/ts/IStreamLoader';
import { MonacoPlayer } from './monaco.player';

export class VidPlayer {
    constructor(
        protected loader: IStreamLoader,
        public player: HTMLMediaElement,
        protected videoId: string,
        protected cacheBuster?: string) {

    }

    public async Load(): Promise<void> {
        const videourl = await this.loader.GetVideoStreamUrl(this.videoId, this.cacheBuster);
        this.player.src = videourl;
    }

    public IsBuffering(): boolean {
        return !this.player.ended && this.player.paused;
    }
}
