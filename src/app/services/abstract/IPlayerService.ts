import { EasyEventEmitter } from 'shared/web/lib/ts/EasyEventEmitter';
import { TraceTransactionLog } from 'shared/Tracer/models/ts/Tracer_pb';

export enum PlayerState {
  Paused,
  Playing,
}

export enum PlayerEvents {
  jump,
  pause,
  play,
  caughtUp,
  buffering,
  loadStart,
  loadComplete,
}

export interface PlayerSettings {
  speedMultiplier: number;
  lookAheadSize: number;
  loadChunkSize: number; // Always make sure this is greater than look ahead
  updateInterval: number;
  loadInterval: number;
  customIncrementer: boolean;
  cacheBuster?: string;
}

export abstract class IPlayerService extends EasyEventEmitter {
  public abstract get position(): number;

  public abstract set position(offset: number);

  public abstract get positionPct(): number;

  public abstract set positionPct(pct: number);

  public abstract get logs(): TraceTransactionLog[];

  public abstract get loadPosition(): number;

  public abstract get duration(): number;

  public abstract get state(): PlayerState;

  public abstract get isBuffering(): boolean;

  public abstract get isCaughtUp(): boolean;

  public async abstract Load(settings?: PlayerSettings): Promise<void>;

  public abstract Dispose(): void;

  public abstract Play(): void;

  public abstract Pause(): void;
}
