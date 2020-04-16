import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaybackEditorComponent } from './playback-editor.component';

describe('PlaybackEditorComponent', () => {
  let component: PlaybackEditorComponent;
  let fixture: ComponentFixture<PlaybackEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaybackEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaybackEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
