import { TestBed } from '@angular/core/testing';

import { NeedsActionsService } from './needs-actions.service';

describe('NeedsActionsService', () => {
  let service: NeedsActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NeedsActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
