import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAssessmentApproverComponent } from './add-assessment-approver.component';

describe('AddAssessmentApproverComponent', () => {
  let component: AddAssessmentApproverComponent;
  let fixture: ComponentFixture<AddAssessmentApproverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAssessmentApproverComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddAssessmentApproverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
