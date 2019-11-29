import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTutorialCardComponent } from './edit-tutorial-card.component';

describe('EditTutorialCardComponent', () => {
  let component: EditTutorialCardComponent;
  let fixture: ComponentFixture<EditTutorialCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditTutorialCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTutorialCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
