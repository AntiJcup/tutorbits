import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.sass']
})
export class TimerComponent implements OnInit {
  private runningInternal = false;
  private intervalHandle: any = null;

  get running(): boolean {
    return this.runningInternal;
  }

  @Input('running')
  set running(val: boolean) {
    this.runningInternal = val;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    if (this.runningInternal) {
      this.timePassed = 0;
      this.intervalHandle = setInterval(() => {
        this.timePassed += 100;
      }, 100);
    }
  }
  timePassed = 0;

  get timerText(): string {
    const baseSeconds = this.timePassed / 1000;
    const hours = Math.floor(baseSeconds / 3600);
    const minutes = Math.floor((baseSeconds - (hours * 3600)) / 60);
    const seconds = Math.floor(baseSeconds - (hours * 3600) - (minutes * 60));

    let hoursStr: string = hours.toString();
    let minutesStr: string = minutes.toString();
    let secondsStr: string = seconds.toString();

    if (hours < 10) { hoursStr = '0' + hoursStr; }
    if (minutes < 10) { minutesStr = '0' + minutesStr; }
    if (seconds < 10) { secondsStr = '0' + secondsStr; }

    return hoursStr + ':' + minutesStr + ':' + secondsStr;
  }

  constructor() { }

  ngOnInit() {
  }


}
