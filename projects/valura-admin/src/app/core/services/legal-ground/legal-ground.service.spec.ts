import { TestBed } from '@angular/core/testing';
import { LegalGroundService } from './legal-ground.service';

describe('LegalGroundService', () => {
  let service: LegalGroundService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LegalGroundService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
