import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-form-preview-dialog',
  templateUrl: './form-preview-dialog.component.html',
  styleUrls: ['./form-preview-dialog.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule
  ]
})
export class FormPreviewDialogComponent {

  externalLink!: SafeResourceUrl;
  dsrFormLink: string = environment.dsrFormDomainUrl;

  constructor(
    public dialogRef: MatDialogRef<FormPreviewDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    const url = this.dsrFormLink;
    this.externalLink = this.sanitizer.bypassSecurityTrustResourceUrl(url) as SafeResourceUrl;
  }

  close() {
    this.dialogRef.close();
  }
}
