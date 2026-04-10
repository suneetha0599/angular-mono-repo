import { TestBed } from '@angular/core/testing';

import { DiscussionLogService } from './discussion-log.service';

describe('DiscussionLogService', () => {
  let service: DiscussionLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiscussionLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
