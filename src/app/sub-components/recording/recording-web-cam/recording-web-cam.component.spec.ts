import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingWebCamComponent } from './recording-web-cam.component';

describe('RecordingWebCamComponent', () => {
  let component: RecordingWebCamComponent;
  let fixture: ComponentFixture<RecordingWebCamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordingWebCamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordingWebCamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
