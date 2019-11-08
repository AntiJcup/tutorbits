import { TestBed } from '@angular/core/testing';

import { TutorBitsApiService } from './tutor-bits-api.service';

describe('TutorBitsApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsApiService = TestBed.get(TutorBitsApiService);
    expect(service).toBeTruthy();
  });
});
