import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewExamplesComponent } from '../view-examples.component

describe('ViewExamplesComponent', () => {
  let component: ViewExamplesComponent;
  let fixture: ComponentFixture<ViewExamplesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewExamplesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
