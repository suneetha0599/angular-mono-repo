import { TestBed } from '@angular/core/testing';
import { AssessmentTypeService } from './assessment-type.service';

describe('AssessmentTypeService', () => {
  let service: AssessmentTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssessmentTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
