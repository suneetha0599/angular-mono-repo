import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentExternalRespondentComponent } from './assessment-external-respondent.component';

describe('AssessmentExternalRespondentComponent', () => {
  let component: AssessmentExternalRespondentComponent;
  let fixture: ComponentFixture<AssessmentExternalRespondentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentExternalRespondentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssessmentExternalRespondentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
