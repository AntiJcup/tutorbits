import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchGuideComponent } from './watch-guide.component';

describe('WatchGuideComponent', () => {
  let component: WatchGuideComponent;
  let fixture: ComponentFixture<WatchGuideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WatchGuideComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
