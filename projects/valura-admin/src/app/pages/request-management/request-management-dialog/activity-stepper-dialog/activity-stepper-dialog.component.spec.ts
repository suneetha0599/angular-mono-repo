import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityStepperDialogComponent } from './activity-stepper-dialog.component';

describe('ActivityStepperDialogComponent', () => {
  let component: ActivityStepperDialogComponent;
  let fixture: ComponentFixture<ActivityStepperDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityStepperDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityStepperDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
