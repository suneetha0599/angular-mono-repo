import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskActionReasonDialogComponent } from './task-action-reason-dialog.component';

describe('TaskActionReasonDialogComponent', () => {
  let component: TaskActionReasonDialogComponent;
  let fixture: ComponentFixture<TaskActionReasonDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskActionReasonDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test Title',
            action: 'PUT_ON_HOLD',
            reasonRequired: true,
            confirmText: 'Confirm',
            cancelText: 'Cancel'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskActionReasonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
