import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentApproversComponent } from './assessment-approvers.component';

describe('AssessmentApproversComponent', () => {
  let component: AssessmentApproversComponent;
  let fixture: ComponentFixture<AssessmentApproversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentApproversComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentApproversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
