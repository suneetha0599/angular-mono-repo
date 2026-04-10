import { TestBed } from '@angular/core/testing';
import { FormConfigurationService } from './form-configuration.service';

describe('FormConfigurationService', () => {
  let service: FormConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
