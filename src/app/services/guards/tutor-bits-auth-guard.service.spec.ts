import { TestBed } from '@angular/core/testing';

import { TutorBitsAuthGuardService } from './tutor-bits-auth-guard.service';

describe('TutorBitsAuthGuardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsAuthGuardService = TestBed.get(TutorBitsAuthGuardService);
    expect(service).toBeTruthy();
  });
});
