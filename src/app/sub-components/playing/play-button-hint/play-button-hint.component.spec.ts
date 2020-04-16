import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayButtonHintComponent } from './play-button-hint.component';

describe('PlayButtonHintComponent', () => {
  let component: PlayButtonHintComponent;
  let fixture: ComponentFixture<PlayButtonHintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayButtonHintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayButtonHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
