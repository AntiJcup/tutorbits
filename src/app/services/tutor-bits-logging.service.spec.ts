import { TestBed } from '@angular/core/testing';

import { TutorBitsLoggingService } from './tutor-bits-logging.service';

describe('TutorBitsLoggingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsLoggingService = TestBed.get(TutorBitsLoggingService);
    expect(service).toBeTruthy();
  });
});
