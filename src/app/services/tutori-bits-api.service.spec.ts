import { TestBed } from '@angular/core/testing';

import { TutoriBitsApiService } from './tutori-bits-api.service';

describe('TutoriBitsApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutoriBitsApiService = TestBed.get(TutoriBitsApiService);
    expect(service).toBeTruthy();
  });
});
