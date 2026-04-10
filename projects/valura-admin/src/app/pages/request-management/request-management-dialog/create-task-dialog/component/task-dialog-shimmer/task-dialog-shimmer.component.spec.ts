import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDialogShimmerComponent } from './task-dialog-shimmer.component';

describe('TaskDialogShimmerComponent', () => {
  let component: TaskDialogShimmerComponent;
  let fixture: ComponentFixture<TaskDialogShimmerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDialogShimmerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskDialogShimmerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
