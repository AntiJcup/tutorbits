import { TestBed } from '@angular/core/testing';

import { TutorBitsAuthService } from './tutor-bits-auth.service';

describe('TutorBitsAuthService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsAuthService = TestBed.get(TutorBitsAuthService);
    expect(service).toBeTruthy();
  });
});
