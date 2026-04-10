import { TestBed } from '@angular/core/testing';
import { SecurityControlService } from './security-control.service';


describe('SecurityControlService', () => {
  let service: SecurityControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecurityControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
