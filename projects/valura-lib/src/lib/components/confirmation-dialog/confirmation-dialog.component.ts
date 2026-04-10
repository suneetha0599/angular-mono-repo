import { Component, HostListener, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DialogService } from '@admin-coreservices/dialog.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule,],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  // providers: [DialogService]
})
export class ConfirmationDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  public confirm(event: any): void {
    this.close(event, true);
  }

  public cancel(event: any): void {
    this.close(event);
  }

  public closeIcon(event: any): void {
    this.close(event);
  }

  @HostListener('keydown.esc')
  public onEsc(event: any): void {
    this.close(event);
  }

  private close(event: any, value: boolean = false): void {
    this.data?.stopEvent && event?.stopPropagation();
    this.dialogRef.close(value);
  }
}
