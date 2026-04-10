import { Injectable, inject } from '@angular/core';
import { TaskAttachment, ProcessedAttachment } from '../../models/task.model';
import { FileUploadParams } from '../../models/task-dto.model';
import { TaskApiService } from '../task-api/task-api.service';
import { TaskStateService } from '../task-state/task-state.service';
import { FILE_UPLOAD_CONFIG } from '../../constants/task.constants';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { DSR_DOCUMENT_UPLOAD } from '@admin-core/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly taskApiService = inject(TaskApiService);
  private readonly taskStateService = inject(TaskStateService);
  private readonly httpService = inject(HttpService);
  private readonly snackbarService = inject(SnackbarService);

  async uploadFiles(files: FileList): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      await this.uploadSingleFile(files[i]);
    }
  }

  async uploadSingleFile(file: File): Promise<void> {
    if (!this.validateFile(file)) {
      return;
    }

    if (this.isDuplicateFile(file.name)) {
      this.snackbarService.openSnack(`${file.name} already added`);
      return;
    }

    await this.processFileUpload(file);
  }

  private validateFile(file: File): boolean {
    if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
      this.snackbarService.openSnack(`File size exceeds ${FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB`);
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!FILE_UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(fileExtension)) {
      this.snackbarService.openSnack(`File type not supported. Allowed: ${FILE_UPLOAD_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`);
      return false;
    }

    return true;
  }

  private isDuplicateFile(fileName: string): boolean {
    return this.taskStateService.uploadedFiles().some(f => f.fileName === fileName);
  }

  private async processFileUpload(file: File): Promise<void> {
    const params: FileUploadParams = {
      fileName: file.name,
      contentType: file.type,
      purpose: DSR_DOCUMENT_UPLOAD
    };

    try {
      this.taskStateService.setFileUploadInProgress(true);
      const uploadResponse = await this.taskApiService.uploadPresignedUrl(params);

      if (!uploadResponse?.presignedUrl || !uploadResponse?.fileKey) {
        throw new Error('Invalid upload response: missing presigned URL or fileKey');
      }
      const uploadResult = await this.taskApiService.getImageEtag(uploadResponse.presignedUrl, file);

      if (!uploadResult) {
        throw new Error('Failed to upload file to cloud storage');
      }
      const eTag = this.extractETag(uploadResult);
      const serverPath = this.extractServerPathFromPresignedUrl(uploadResponse.presignedUrl);
      const attachmentData: TaskAttachment = {
        file: file,
        fileName: file.name,
        fileKey: uploadResponse.fileKey,
        presignedUrl: uploadResponse.presignedUrl,
        fileSize: file.size,
        eTag: eTag,
        serverPath: serverPath,
        isExisting: false
      };

      this.taskStateService.addUploadedFile(attachmentData);
      this.snackbarService.openSnack(`${file.name} uploaded successfully!`);

    } catch (error) {
      console.error('File upload error:', error);
      this.snackbarService.openSnack(`${file.name} upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.taskStateService.setFileUploadInProgress(false);
    }
  }

  private extractETag(uploadResult: any): string {
    if (!uploadResult) {
      return '';
    }
    if (uploadResult.headers) {
      const eTag = uploadResult.headers.get('ETag') || uploadResult.headers.get('etag');
      if (eTag) {
        return eTag;
      }
    }
    if (uploadResult.eTag) {
      return uploadResult.eTag;
    }
    if (uploadResult.body?.eTag) {
      return uploadResult.body.eTag;
    }

    console.warn('ETag not found in upload result, this may cause issues with file verification');
    return '';
  }

  private extractServerPathFromPresignedUrl(presignedUrl: string): string {
    try {
      const url = new URL(presignedUrl);
      return `${url.origin}${url.pathname}`;
    } catch (error) {
      console.error('Error extracting server path from presigned URL:', error);
      return '';
    }
  }

  async processAttachmentsForSubmission(attachments: TaskAttachment[]): Promise<string[]> {
    if (attachments.length === 0) {
      return [];
    }
    const fileKeys: string[] = attachments
      .filter(attachment => attachment.fileKey && attachment.eTag)
      .map(attachment => attachment.fileKey!);

    if (fileKeys.length !== attachments.length) {
      const incompleteAttachments = attachments.filter(att => !att.fileKey || !att.eTag);
      console.warn('Some attachments are incomplete:', incompleteAttachments);
      this.snackbarService.openSnack('Some files may not be properly uploaded');
    }

    return fileKeys;
  }

  removeFile(index: number): void {
    this.taskStateService.removeUploadedFile(index);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  areAllFilesCompletelyUploaded(): boolean {
    const uploadedFiles = this.taskStateService.uploadedFiles();
    return uploadedFiles.every(file => file.fileKey && (file.eTag || file.isExisting));
  }
}
