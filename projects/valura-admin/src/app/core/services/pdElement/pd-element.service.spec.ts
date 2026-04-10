import { TestBed } from '@angular/core/testing';

import { PdElementService } from './pd-element.service';

describe('PdElementService', () => {
  let service: PdElementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdElementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
