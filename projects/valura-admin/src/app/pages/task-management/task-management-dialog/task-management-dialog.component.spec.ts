import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskManagementDialogComponent } from './task-management-dialog.component';

describe('TaskManagementDialogComponent', () => {
  let component: TaskManagementDialogComponent;
  let fixture: ComponentFixture<TaskManagementDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskManagementDialogComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaskManagementDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
