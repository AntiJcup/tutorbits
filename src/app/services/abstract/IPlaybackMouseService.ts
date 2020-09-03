import { EasyEventEmitter } from 'shared/web/lib/ts/EasyEventEmitter';

export interface Position {
  x: number;
  y: number;
}

export enum PlaybackMouseEvents {
  positionChanged,
  show,
  hide
}

export abstract class IPlaybackMouseService extends EasyEventEmitter {
  public abstract get visible();
  public abstract set visible(v: boolean);

  public abstract get position(): Position;
  public abstract set position(p: Position);

  public abstract set x(n: number);
  public abstract set y(n: number);

  public abstract get tweenEnabled(): boolean;
  public abstract set tweenEnabled(t: boolean);
}
