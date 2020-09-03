import { EventEmitter } from 'events';

export class EventSub {
  constructor(
    public event: string | symbol,
    public listener: (...args: any[]) => void,
    public emitter: EventEmitter) {
  }

  public Dispose(): void {
    this.emitter.removeListener(this.event, this.listener);
  }
}

export class EasyEventEmitter extends EventEmitter {
  public sub(event: string | symbol, listener: (...args: any[]) => void): EventSub {
    this.on(event, listener);
    return new EventSub(event, listener, this);
  }

  public subOnce(event: string | symbol, listener: (...args: any[]) => void): EventSub {
    this.once(event, listener);
    return new EventSub(event, listener, this);
  }
}
