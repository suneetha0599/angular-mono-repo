// task-dialog-shimmer.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-task-dialog-shimmer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl:'./task-dialog-shimmer.component.html',
  styleUrl: './task-dialog-shimmer.component.scss'
})
export class TaskDialogShimmerComponent {
  @Input() dialogType: 'TASK_FORM' | 'DATA_FULFILLMENT_VIEW' = 'TASK_FORM';
  @Input() showFileUpload: boolean = true;
  @Input() showInfoMessage: boolean = false;
}
