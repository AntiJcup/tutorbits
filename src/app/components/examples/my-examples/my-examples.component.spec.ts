import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyExamplesComponent } from '../my-examples.component

describe('ViewExamplesComponent', () => {
  let component: MyExamplesComponent;
  let fixture: ComponentFixture<MyExamplesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyExamplesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
