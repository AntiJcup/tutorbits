import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyQuestionsComponent } from './my-questions.component';

describe('ViewQuestionsComponent', () => {
  let component: MyQuestionsComponent;
  let fixture: ComponentFixture<MyQuestionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyQuestionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyQuestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
