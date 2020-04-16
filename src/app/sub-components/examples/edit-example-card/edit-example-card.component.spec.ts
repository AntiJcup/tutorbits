import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditExampleCardComponent } from './edit-example-card.component';

describe('EditExampleCardComponent', () => {
  let component: EditExampleCardComponent;
  let fixture: ComponentFixture<EditExampleCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditExampleCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditExampleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
