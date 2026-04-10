import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

@Component({
  selector: 'app-doc-viewer-dialog',
  imports: [CommonModule, MatButtonModule, MatDialogActions, MatCheckboxModule, NgxDocViewerModule,
    LoadingButtonComponent, MatIconModule, FormsModule, ImageViewerComponent, NgxExtendedPdfViewerModule,],
  templateUrl: './doc-viewer-dialog.component.html',
  styleUrl: './doc-viewer-dialog.component.scss'
})
export class DocViewerDialogComponent {

  checkboxChecked = false;
  fileName: string;
  isDoneLoading: boolean = false
  requestRid: number = 0;
  isTaskView: boolean = false;
  type: any;
  doc: any;
  zoomValue: number = 50

  constructor(
    private apiHelperService: ApiHelperService,
    public dialogRef: MatDialogRef<DocViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { doc: string, fileName: string, requestRid: number, isTaskView?: boolean }
  ) {
    this.doc = data?.doc;
    this.fileName = data?.fileName;
    this.requestRid = data?.requestRid ?? 0,
      this.isTaskView = data?.isTaskView ?? false

    this.type = this.getFileType(this.doc)
  }

  closeDialog(): void {
    this.dialogRef?.close();
  }

  confirm() {
    this.saveDsrVarificationDetails()
  }

  saveDsrVarificationDetails() {
    if (!this.checkboxChecked) {
      return
    }
    const data = { "isDocumentVerified": true }
    const eventName = "DOCUMENT_VERIFY";

    const body = {
      "data": data
    }
    this.isDoneLoading = true
    this.apiHelperService.saveDsrRequestDetails(body, this.requestRid, eventName)
      .subscribe({
        next: async (res) => {
          this.dialogRef.close({ documentVerified: true });
          this.isDoneLoading = false
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isDoneLoading = false
        },
      });
  }

  get confirmBtnDisabled() {
    return (this.isDoneLoading) || (!this.checkboxChecked)
  }

  async downloadFile(url: string, filename: string) {
    try {
      const response = await fetch(url, { method: 'GET' });
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }


  getFileType(fileKey: string): 'pdf' | 'image' | 'text' | 'other' {
    const fullkey = fileKey.split('?')[0];

    const ext = fullkey.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
    if (ext === 'txt') return 'text';
    return 'other';
  }

  onZoomChange(newZoom: any) {
    console.log('Zoom changed to:', newZoom);
  }

  zoomIn() {
    this.zoomValue = this.zoomValue + 10
  }

  zoomOut() {
    this.zoomValue = this.zoomValue - 10
  }
}
