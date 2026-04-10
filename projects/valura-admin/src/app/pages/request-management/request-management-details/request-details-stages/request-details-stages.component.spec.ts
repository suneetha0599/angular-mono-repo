import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestDetailsStagesComponent } from './request-details-stages.component';

describe('RequestDetailsStagesComponent', () => {
  let component: RequestDetailsStagesComponent;
  let fixture: ComponentFixture<RequestDetailsStagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestDetailsStagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestDetailsStagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
