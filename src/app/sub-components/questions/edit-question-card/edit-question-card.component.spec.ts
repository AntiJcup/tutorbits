import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditQuestionCardComponent } from './edit-question-card.component';

describe('EditQuestionCardComponent', () => {
  let component: EditQuestionCardComponent;
  let fixture: ComponentFixture<EditQuestionCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditQuestionCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditQuestionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
