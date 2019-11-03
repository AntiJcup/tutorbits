import { StreamLoader } from 'shared/media/lib/ts/StreamLoader';
import { MonacoPlayer } from './monaco.player';

export class VidPlayer {
    constructor(
        protected loader: StreamLoader,
        public player: HTMLMediaElement) {

    }

    public async Load(): Promise<void> {
        const videourl = await this.loader.GetVideoStreamUrl();
        this.player.src = videourl;
    }

    public IsBuffering(): boolean {
        return !this.player.ended && this.player.paused;
    }
}
