import { TestBed } from '@angular/core/testing';

import { TutorBitsStorageService } from './tutor-bits-storage.service';

describe('TutorBitsStorageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TutorBitsStorageService = TestBed.get(TutorBitsStorageService);
    expect(service).toBeTruthy();
  });
});
