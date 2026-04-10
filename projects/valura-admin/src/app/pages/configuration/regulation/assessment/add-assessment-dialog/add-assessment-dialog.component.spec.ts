import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAssessmentDialogComponent } from './add-assessment-dialog.component';

describe('AddAssessmentDialogComponent', () => {
  let component: AddAssessmentDialogComponent;
  let fixture: ComponentFixture<AddAssessmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAssessmentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAssessmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
