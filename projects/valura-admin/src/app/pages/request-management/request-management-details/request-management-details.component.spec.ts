import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestManagementDetailsComponent } from './request-management-details.component';

describe('RequestManagementDetailsComponent', () => {
  let component: RequestManagementDetailsComponent;
  let fixture: ComponentFixture<RequestManagementDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestManagementDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestManagementDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
