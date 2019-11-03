import { StreamLoader } from 'shared/media/lib/ts/StreamLoader';
import { VgPlayer } from 'videogular2/compiled/core';

export class VidPlayer {
    constructor(
        protected loader: StreamLoader,
        protected player: HTMLVideoElement) {

    }

    public async Load(): Promise<void> {
        const videourl = await this.loader.GetVideoStreamUrl();
        this.player.src = videourl;
    }
}
