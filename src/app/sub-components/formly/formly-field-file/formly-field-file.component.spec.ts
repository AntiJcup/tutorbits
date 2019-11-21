import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormlyFieldFileComponent } from './formly-field-file.component';

describe('FormlyFieldFileComponent', () => {
  let component: FormlyFieldFileComponent;
  let fixture: ComponentFixture<FormlyFieldFileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormlyFieldFileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormlyFieldFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
