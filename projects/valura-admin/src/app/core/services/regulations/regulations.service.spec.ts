import { TestBed } from '@angular/core/testing';
import { RegulationsService } from './regulations.service';


describe('RegulationsService', () => {
  let service: RegulationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegulationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
