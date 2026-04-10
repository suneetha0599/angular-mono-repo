import { TestBed } from '@angular/core/testing';

import { SecureImgService } from './secure-img.service';

describe('SecureImgService', () => {
  let service: SecureImgService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecureImgService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
