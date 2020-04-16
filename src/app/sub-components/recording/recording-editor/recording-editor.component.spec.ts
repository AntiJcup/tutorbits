import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingEditorComponent } from './recording-editor.component';

describe('RecordingEditorComponent', () => {
  let component: RecordingEditorComponent;
  let fixture: ComponentFixture<RecordingEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordingEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordingEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
