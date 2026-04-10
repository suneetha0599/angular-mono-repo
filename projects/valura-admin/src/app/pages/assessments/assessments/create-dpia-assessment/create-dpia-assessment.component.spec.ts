import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDpiaAssessmentComponent } from './create-dpia-assessment.component';

describe('CreateDpiaAssessmentComponent', () => {
  let component: CreateDpiaAssessmentComponent;
  let fixture: ComponentFixture<CreateDpiaAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDpiaAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDpiaAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
