import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherEditorComponent } from './teacher-editor.component';

describe('TeacherEditorComponent', () => {
  let component: TeacherEditorComponent;
  let fixture: ComponentFixture<TeacherEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TeacherEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TeacherEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
