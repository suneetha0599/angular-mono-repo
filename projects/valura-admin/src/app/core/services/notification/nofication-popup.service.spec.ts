import { TestBed } from '@angular/core/testing';

import { NotificationPopupService } from './nofication-popup.service';

describe('NoficationPopupService', () => {
  let service: NotificationPopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationPopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
