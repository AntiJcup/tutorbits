import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountUpdateUserNameComponent } from './account-update-user-name.component';

describe('AccountUpdateUserNameComponent', () => {
  let component: AccountUpdateUserNameComponent;
  let fixture: ComponentFixture<AccountUpdateUserNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountUpdateUserNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountUpdateUserNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
