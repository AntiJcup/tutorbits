import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSandboxComponent } from './create-sandbox.component';

describe('CreateSandboxComponent', () => {
  let component: CreateSandboxComponent;
  let fixture: ComponentFixture<CreateSandboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateSandboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSandboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
