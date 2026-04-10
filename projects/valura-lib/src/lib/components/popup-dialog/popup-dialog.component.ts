import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';

export interface PopupDialogData {
  type: 'confirmation' | 'pdElements';
  title: string;
  content?: string;
  confirmationDetail?: string;
  pdElements?: string[];
  confirmText?: string;
  cancelText?: string;
  showIcon?: boolean;
  iconName?: string;
  iconColor?: string;
  confirmIcon?: string; 
}

@Component({
  selector: 'app-popup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    LoadingButtonComponent
  ],
  templateUrl: './popup-dialog.component.html',
  styleUrl: './popup-dialog.component.scss'
})
export class PopupDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PopupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PopupDialogData
  ) { }


  getIconClass(): string {
    if (this.data.iconColor) {
      return this.data.iconColor;
    }

    switch (this.data.type) {
      case 'confirmation':
        return 'text-red-600 text-2xl';
      case 'pdElements':
        return 'text-blue-600 text-2xl';
      default:
        return 'text-gray-600 text-2xl';
    }
  }

  onConfirm(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
