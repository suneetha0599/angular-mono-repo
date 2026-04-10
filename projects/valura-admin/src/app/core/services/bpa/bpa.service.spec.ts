import { TestBed } from '@angular/core/testing';

import { BpaService } from './bpa.service';

describe('BpaService', () => {
  let service: BpaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BpaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
