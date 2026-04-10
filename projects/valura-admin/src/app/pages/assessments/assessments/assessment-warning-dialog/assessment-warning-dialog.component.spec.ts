import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentWarningDialogComponent } from './assessment-warning-dialog.component';

describe('AssessmentWarningDialogComponent', () => {
  let component: AssessmentWarningDialogComponent;
  let fixture: ComponentFixture<AssessmentWarningDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentWarningDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentWarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
