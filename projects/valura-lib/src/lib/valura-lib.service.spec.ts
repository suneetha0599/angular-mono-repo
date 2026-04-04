import { TestBed } from '@angular/core/testing';

import { ValuraLibService } from './valura-lib.service';

describe('ValuraLibService', () => {
  let service: ValuraLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValuraLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
