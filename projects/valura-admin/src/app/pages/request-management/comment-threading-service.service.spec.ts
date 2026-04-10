import { TestBed } from '@angular/core/testing';

import { CommentThreadingService } from './comment-threading-service.service';

describe('CommentThreadingServiceService', () => {
  let service: CommentThreadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentThreadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
