import { TestBed } from '@angular/core/testing';

import { RuleBuilderService } from './rule-builder.service';

describe('RuleBuilderService', () => {
  let service: RuleBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RuleBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
