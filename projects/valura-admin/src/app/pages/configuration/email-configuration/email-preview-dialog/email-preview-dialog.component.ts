import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-email-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './email-preview-dialog.component.html',
  styleUrl: './email-preview-dialog.component.scss'
})
export class EmailPreviewDialogComponent {
  sanitizedHtml: SafeHtml;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { subject: string; htmlContent: string },
    private dialogRef: MatDialogRef<EmailPreviewDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(data.htmlContent);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}