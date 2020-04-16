import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordingFileTreeComponent } from './recording-file-tree.component';

describe('RecordingFileTreeComponent', () => {
  let component: RecordingFileTreeComponent;
  let fixture: ComponentFixture<RecordingFileTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecordingFileTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordingFileTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
