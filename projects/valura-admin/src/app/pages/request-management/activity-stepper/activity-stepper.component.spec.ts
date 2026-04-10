import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityStepperComponent } from './activity-stepper.component';

describe('ActivityStepperComponent', () => {
  let component: ActivityStepperComponent;
  let fixture: ComponentFixture<ActivityStepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityStepperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
