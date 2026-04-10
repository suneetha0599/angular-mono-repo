import { TestBed } from '@angular/core/testing';

import { RequestManagementService } from './request-management.service';

describe('RequestManagementService', () => {
  let service: RequestManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
