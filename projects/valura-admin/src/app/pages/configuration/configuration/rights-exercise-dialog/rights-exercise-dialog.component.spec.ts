import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightsExerciseDialogComponent } from './rights-exercise-dialog.component';

describe('RightsExerciseDialogComponent', () => {
  let component: RightsExerciseDialogComponent;
  let fixture: ComponentFixture<RightsExerciseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RightsExerciseDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RightsExerciseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
