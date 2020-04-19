import { TestBed } from '@angular/core/testing';

import { TutorBitsRequestService } from './tutor-bits-request.service';

describe('TutorBitsRequestService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsRequestService = TestBed.get(TutorBitsRequestService);
    expect(service).toBeTruthy();
  });
});
