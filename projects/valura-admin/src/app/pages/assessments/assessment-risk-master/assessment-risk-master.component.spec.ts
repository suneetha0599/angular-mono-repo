import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentRiskMasterComponent } from './assessment-risk-master.component';

describe('AssessmentRiskMasterComponent', () => {
  let component: AssessmentRiskMasterComponent;
  let fixture: ComponentFixture<AssessmentRiskMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentRiskMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentRiskMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
