import { TestBed } from '@angular/core/testing';

import { TutorBitsExampleService } from './tutor-bits-example.service';

describe('TutorBitsExampleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsExampleService = TestBed.get(TutorBitsExampleService);
    expect(service).toBeTruthy();
  });
});
