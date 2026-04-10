import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-display-text-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule,],
  templateUrl: './display-text-preview-dialog.component.html',
  styleUrl: './display-text-preview-dialog.component.scss'
})
export class DisplayTextPreviewDialogComponent {
  sanitizedHtml: SafeHtml;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; htmlContent: string },
    private dialogRef: MatDialogRef<DisplayTextPreviewDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(data.htmlContent);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
