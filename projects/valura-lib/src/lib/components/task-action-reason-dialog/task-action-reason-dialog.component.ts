import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';

export interface TaskActionReasonDialogData {
  title: string;
  action: string;
  reasonRequired: boolean;
  confirmText?: string;
  cancelText?: string;
}

export interface TaskActionReasonDialogResult {
  confirmed: boolean;
  reason: string;
}

@Component({
  selector: 'app-task-action-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TextFieldModule,
    LoadingButtonComponent
  ],
  templateUrl: './task-action-reason-dialog.component.html',
  styleUrl: './task-action-reason-dialog.component.scss'
})
export class TaskActionReasonDialogComponent {
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<TaskActionReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskActionReasonDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close({ confirmed: true, reason: this.reason.trim() } as TaskActionReasonDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false, reason: '' } as TaskActionReasonDialogResult);
  }
}
