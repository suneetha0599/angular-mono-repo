import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentApproversDetailsComponent } from './assessment-approvers-details.component';

describe('AssessmentApproversDetailsComponent', () => {
  let component: AssessmentApproversDetailsComponent;
  let fixture: ComponentFixture<AssessmentApproversDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentApproversDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentApproversDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
