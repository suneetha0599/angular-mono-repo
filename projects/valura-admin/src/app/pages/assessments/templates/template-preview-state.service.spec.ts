import { TestBed } from '@angular/core/testing';

import { TemplatePreviewStateService } from './template-preview-state.service';

describe('TemplatePreviewStateService', () => {
  let service: TemplatePreviewStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplatePreviewStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
