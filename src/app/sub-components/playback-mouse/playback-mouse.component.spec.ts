import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaybackMouseComponent } from './playback-mouse.component';

describe('PlaybackMouseComponent', () => {
  let component: PlaybackMouseComponent;
  let fixture: ComponentFixture<PlaybackMouseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaybackMouseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaybackMouseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
