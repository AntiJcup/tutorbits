import { IPlaybackMouseService, Position, PlaybackMouseEvents } from '../abstract/IPlaybackMouseService';

export class TutorBitsPlaybackMouseService extends IPlaybackMouseService {
  // tslint:disable-next-line: variable-name
  private visible_ = false;

  // tslint:disable-next-line: variable-name
  private position_: Position = { x: 0, y: 0 };

  // tslint:disable-next-line: variable-name
  private tweenEnabled_ = false;

  public get visible(): boolean {
    return this.visible_;
  }

  public set visible(v: boolean) {
    this.visible_ = v;
    if (this.visible_) {
      this.emit(PlaybackMouseEvents[PlaybackMouseEvents.show]);
    } else {
      this.emit(PlaybackMouseEvents[PlaybackMouseEvents.hide]);
    }
  }

  public get position(): Position {
    return this.position_;
  }

  public set position(p: Position) {
    this.position_ = p;

    this.emit(PlaybackMouseEvents[PlaybackMouseEvents.positionChanged], p);
  }

  public set x(n: number) {
    this.position_.x = n;

    this.emit(PlaybackMouseEvents[PlaybackMouseEvents.positionChanged], this.position_);
  }

  public set y(n: number) {
    this.position_.y = n;

    this.emit(PlaybackMouseEvents[PlaybackMouseEvents.positionChanged], this.position_);
  }

  public get tweenEnabled(): boolean {
    return this.tweenEnabled_;
  }

  public set tweenEnabled(t: boolean) {
    this.tweenEnabled_ = t;
  }

}
