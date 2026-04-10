import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendAssessmentDialogComponent } from './send-assessment-dialog.component';

describe('SendAssessmentDialogComponent', () => {
  let component: SendAssessmentDialogComponent;
  let fixture: ComponentFixture<SendAssessmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendAssessmentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendAssessmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
