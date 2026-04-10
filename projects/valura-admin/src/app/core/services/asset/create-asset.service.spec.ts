import { TestBed } from '@angular/core/testing';

import { CreateAssetService } from './create-asset.service';

describe('CreateAssetService', () => {
  let service: CreateAssetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreateAssetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
