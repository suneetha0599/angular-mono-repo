import { Component, EventEmitter, inject, Input, NgZone, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ETAG } from '@admin-core/constants/api-constants';
import { DSR_ATTACHMENT } from '@admin-core/constants/constants';
import { validateImageFile } from '@admin-core/constants/file-upload.constants';
import { Attachment } from '@admin-core/models/request-management/DsrRequest';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { FileDropDirective } from 'app/directives/file-drop/file-drop.directive';
import { DocViewerDialogComponent } from @admin - page / request - management / request - management - dialog / doc - viewer - dialog / doc - viewer - dialog.component';

@Component({
  selector: 'custom-file-upload',
  imports: [FileDropDirective, MatIconModule, MatTooltipModule],
  templateUrl: './custom-file-upload.component.html',
  styleUrl: './custom-file-upload.component.scss'
})
export class CustomFileUploadComponent {

  @Input() label: string = ''
  @Input() infoMessage: string = ''
  @Input() fileUploadSupportedText: string = ''
  @Input() fileUploadAccept: string = ''
  @Input() purpose: string = DSR_ATTACHMENT;
  @Input() selectedFiles: any[] = [];
  @Input() fileUploadInProgress: boolean = false;
  @Input() hideuploder: boolean = false;
  @Input() hideTooltip: boolean = false;


  @Output() onUploadPresignedUrl = new EventEmitter<any>();
  @Output() onRemoveFile = new EventEmitter<any>();
  @Output() uploadStatus = new EventEmitter<any>();

  uploadingFiles: { fileName: string; fileSize: string; progress: number }[] = [];

  private snackbarService = inject(SnackbarService);
  private apiHelperService = inject(ApiHelperService);
  private ngZone = inject(NgZone);

  constructor(public dialog: MatDialog,) { }

  ngOnInit() {
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return bytes + 'B';
  }

  onclick(event: any) {
    event.target.value = ''
  }

  onFileDropped(fileList: FileList) {
    if (!fileList) return;
    this.handleFiles(Array.from(fileList));
  }

  onFileBrowse(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;
    this.handleFiles(Array.from(target.files));
  }

  async handleFiles(files: File[]) {
    this.fileUploadInProgress = true;
    this.uploadStatus.emit({ fileUploadInProgress: this.fileUploadInProgress });
    try {
      const fileUploadQueue = files.map(file => this.onFileChange(file));
      await Promise.all(fileUploadQueue);
    } finally {
      this.fileUploadInProgress = false;
      this.uploadStatus.emit({ fileUploadInProgress: this.fileUploadInProgress });
    }
  }

  async onFileChange(file: File): Promise<Attachment | null> {
    const validation = validateImageFile(file);

    if (!validation.isValid) {
      this.snackbarService.openSnack(validation.errorMessage || 'Invalid file');
      return null;
    }

    if (this.selectedFiles.some(f => f.fileName === file.name)) {
      return null;
    }

    const uploadingFile = {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      progress: 0
    };
    this.uploadingFiles.push(uploadingFile);

    const result = await this.uploadPresignedUrl(file, uploadingFile);
    this.uploadingFiles = this.uploadingFiles.filter(f => f !== uploadingFile);
    if (result) {
      this.selectedFiles = [...this.selectedFiles, result];
      this.onUploadPresignedUrl.emit({ selectedFiles: this.selectedFiles });
    }

    return result;
  }

  startSimulatedProgress(uploadingFile: { progress: number }, maxProgress: number): ReturnType<typeof setInterval> {
    return setInterval(() => {
      this.ngZone.run(() => {
        if (uploadingFile.progress < maxProgress) {
          uploadingFile.progress += 1;
        }
      });
    }, 200);
  }

  async uploadPresignedUrl(file: File, uploadingFile: { progress: number }): Promise<Attachment | null> {
    const params = {
      fileName: file.name,
      contentType: file.type,
      purpose: this.purpose
    };

    uploadingFile.progress = 2;
    const presignedInterval = this.startSimulatedProgress(uploadingFile, 40);

    const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
    clearInterval(presignedInterval);

    if (!imageInfo) return null;

    const fileData = {
      ...imageInfo,
      file,
      fileName: file.name
    };

    if (!fileData.presignedUrl || !fileData.fileKey) return null;

    const res: any = await this.uploadWithProgress(fileData.file, fileData.presignedUrl, uploadingFile);
    if (!res) return null;

    return new Attachment({
      filePath: fileData.fileKey,
      eTag: res.headers[ETAG] || res.headers['etag'],
      fileName: fileData.fileName
    });
  }

  removeFile(index: number) {
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
      this.onRemoveFile.emit({ selectedFiles: this.selectedFiles });
    }
  }

  uploadWithProgress(file: File, presignedUrl: string, uploadingFile: { progress: number }): Promise<any> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      const startProgress = uploadingFile.progress;
      const remaining = 100 - startProgress;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          this.ngZone.run(() => {
            uploadingFile.progress = startProgress + Math.round((event.loaded / event.total) * remaining);
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const headers: Record<string, string> = {};
          const etagHeader = xhr.getResponseHeader(ETAG) || xhr.getResponseHeader('etag');
          if (etagHeader) {
            headers[ETAG] = etagHeader;
            headers['etag'] = etagHeader;
          }
          resolve({ status: xhr.status, headers });
        } else {
          resolve(null);
        }
      });

      xhr.addEventListener('error', () => resolve(null));

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  async viewDocument(file: any) {
    const params = {
      "fileKey": file.fileUrl ?? file.fileKey,
    }
    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: this.getFileName(file.fileName) || '',
          isTaskView: true
        },
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        maxWidth: '100vh',
        disableClose: false,
        panelClass: 'dialog-wrapper',
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe((result: any) => {
      });
    }

    else {
      console.error('Failed to get presigned URL');
    }
  }

  onDocNameClick(doc: any) {
    if (!doc) {
      console.error("No fileKey found for document", doc);
      return;
    }
    this.viewDocument(doc);
  }

  getFileName(fileKey: string): string {
    if (!fileKey) return '';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
  }
}
