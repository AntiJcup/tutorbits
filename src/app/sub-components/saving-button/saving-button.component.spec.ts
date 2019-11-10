import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingButtonComponent } from './saving-button.component';

describe('SavingButtonComponent', () => {
  let component: SavingButtonComponent;
  let fixture: ComponentFixture<SavingButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SavingButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SavingButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
