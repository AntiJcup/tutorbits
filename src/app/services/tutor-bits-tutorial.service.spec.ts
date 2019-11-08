import { TestBed } from '@angular/core/testing';

import { TutorBitsTutorialService } from './tutor-bits-tutorial.service';

describe('TutorBitsTutorialService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsTutorialService = TestBed.get(TutorBitsTutorialService);
    expect(service).toBeTruthy();
  });
});
