import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DiscussionLogService, ConversationMessage, MessageAttachment } from '../discussion-log.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { TASK_ATTACHMENT } from '@admin-core/constants/constants';
import { ETAG } from '@admin-core/constants/api-constants';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

export type MessageMode = 'RESPONSE' | 'REMARK' | 'ATTACHMENT';

interface DisplayMessage {
  id: number;
  senderName: string;
  role?: string;
  message?: string;
  fileName?: string;
  time: string;
  fileKey?: string;
  attachmentCount?: number;
  source?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  progress: number;
  file: File;
  fileKey?: string;
}

interface UploadedFileData {
  file: File;
  presignedUrl: string;
  fileKey: string;
  originalFileName: string;
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatProgressBarModule, MatButtonModule],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnInit, OnDestroy {
  @Input() mode: MessageMode = 'RESPONSE';
  @Output() onItemClick = new EventEmitter<{ type: MessageMode, id: number, data: any }>();
  @Input() requestRid!: number;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  private apiHelperService = inject(ApiHelperService);
  private dialog = inject(MatDialog);
  private discussionService = inject(DiscussionLogService);

  messages: DisplayMessage[] = [];
  uploadingFiles: UploadingFile[] = [];

  currentPage: number = 1;
  pageSize: number = 10;
  hasMoreMessages: boolean = true;
  isLoadingMore: boolean = false;
  isLoading: boolean = false;
  isUploading: boolean = false;

  maxTotalFiles: number = 10;
  maxSizeInBytes: number = 10 * 1024 * 1024;
  acceptedTypes: string = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';

  private subscription: Subscription | null = null;
  hoveredAttachmentId: number | null = null;

  ngOnInit(): void {
    this.isLoading = true;
    this.loadMessages();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadMessages(): void {
    if (this.mode === 'ATTACHMENT') {
      this.subscription = this.discussionService.getAttachments().subscribe(attachments => {

        this.messages = this.mapAttachmentsToDisplay(attachments).reverse();
        this.isLoading = false;
      });
    } else if (this.mode === 'RESPONSE') {
      this.subscription = this.discussionService.getMessagesByType('Response', this.currentPage, this.pageSize)
        .subscribe(messages => {
          const newMessages = this.mapMessagesToDisplay(messages);
          if (this.currentPage === 1) {
            this.messages = newMessages;
          } else {
            this.messages = [...this.messages, ...newMessages];
          }
          this.hasMoreMessages = messages.length === this.pageSize;
          this.isLoadingMore = false;
          this.isLoading = false;
        });
    } else if (this.mode === 'REMARK') {
      this.subscription = this.discussionService.getMessagesByType('Remark', this.currentPage, this.pageSize)
        .subscribe(messages => {
          const newMessages = this.mapMessagesToDisplay(messages);
          if (this.currentPage === 1) {
            this.messages = newMessages;
          } else {
            this.messages = [...this.messages, ...newMessages];
          }
          this.hasMoreMessages = messages.length === this.pageSize;
          this.isLoadingMore = false;
          this.isLoading = false;
        });
    }
  }

  openAttachmentUpload(): void {
    this.fileInput.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;

    if (!selectedFiles || selectedFiles.length === 0) return;


    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
    const filesArray = Array.from(selectedFiles);

    for (const file of filesArray) {
      if (file.size > this.maxSizeInBytes) {
        alert(`File "${file.name}" exceeds 10MB limit.`);
        continue;
      }

      const isDuplicate = this.uploadingFiles.some(
        f => f.name === file.name && f.file.size === file.size
      );



      const fileItem: UploadingFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: this.formatFileSize(file.size),
        progress: 0,
        file: file
      };

      this.uploadingFiles.push(fileItem);
    }

    input.value = '';

    if (this.uploadingFiles.length > 0) {
      await this.uploadFiles();
    }
  }
  async deleteAttachment(attachmentId: number, event: Event): Promise<void> {
    event.stopPropagation();



    try {
      await this.apiHelperService.deleteTaskAttachment(this.requestRid, attachmentId);
      this.loadMessages();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  }
  private async uploadFiles(): Promise<void> {
    if (this.uploadingFiles.length === 0 || this.isUploading) return;

    this.isUploading = true;
    const uploadedFilesData: UploadedFileData[] = [];


    const filesToUpload = [...this.uploadingFiles];

    try {
      for (const fileItem of filesToUpload) {

        const stillExists = this.uploadingFiles.find(f => f.id === fileItem.id);
        if (!stillExists) {

          continue;
        }

        const params = {
          fileName: fileItem.file.name,
          contentType: fileItem.file.type,
          purpose: TASK_ATTACHMENT,
        };

        try {
          this.updateFileProgress(fileItem.id, 10);


          if (!this.uploadingFiles.find(f => f.id === fileItem.id)) {
            continue;
          }

          const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);

          if (imageInfo) {

            if (!this.uploadingFiles.find(f => f.id === fileItem.id)) {
              continue;
            }

            this.updateFileProgress(fileItem.id, 50);

            const fileData: UploadedFileData = {
              file: fileItem.file,
              presignedUrl: imageInfo.presignedUrl,
              fileKey: imageInfo.fileKey,
              originalFileName: fileItem.file.name
            };


            if (!this.uploadingFiles.find(f => f.id === fileItem.id)) {
              continue;
            }

            await this.uploadToS3(fileData, fileItem.id);

            if (this.uploadingFiles.find(f => f.id === fileItem.id)) {
              uploadedFilesData.push(fileData);
            }
          }
        } catch (error) {
          console.error('Error uploading file:', fileItem.name, error);
          this.updateFileProgress(fileItem.id, 0);
        }
      }

      if (uploadedFilesData.length > 0) {
        const attachments = uploadedFilesData.map(att => ({
          fileKey: att.fileKey,
          fileName: att.originalFileName,
          source: 'TASK_ATTACHMENT'
        }));

        await this.apiHelperService.uploadTaskAttachments(this.requestRid, attachments);

        this.uploadingFiles = [];
        this.loadMessages();
      } else {
        this.uploadingFiles = [];
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      this.isUploading = false;
    }
  }

  private async uploadToS3(uploadedFile: UploadedFileData, fileItemId: string): Promise<void> {
    const { file, presignedUrl, fileKey } = uploadedFile;

    try {
      this.updateFileProgress(fileItemId, 70);

      const res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);

      if (res && res.headers && res.headers.get(ETAG)) {
        this.updateFileProgress(fileItemId, 100);

        const fileIndex = this.uploadingFiles.findIndex(f => f.id === fileItemId);
        if (fileIndex !== -1) {
          this.uploadingFiles[fileIndex].fileKey = fileKey;
        }
      } else {
        console.error(`Failed to upload file: ${file.name}`);
        this.updateFileProgress(fileItemId, 0);
      }
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      this.updateFileProgress(fileItemId, 0);
    }
  }

  private updateFileProgress(fileId: string, progress: number): void {
    const file = this.uploadingFiles.find(f => f.id === fileId);
    if (file) {
      file.progress = progress;
    }
  }

  removeUploadingFile(id: string): void {
    const index = this.uploadingFiles.findIndex(f => f.id === id);
    if (index !== -1) {
      this.uploadingFiles.splice(index, 1);
    }
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 50;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;

    if (atBottom && !this.isLoadingMore && this.hasMoreMessages && this.mode !== 'ATTACHMENT') {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages(): void {
    if (this.isLoadingMore || !this.hasMoreMessages) return;

    this.isLoadingMore = true;
    this.currentPage++;
    this.loadMessages();
  }

  private mapMessagesToDisplay(messages: ConversationMessage[]): DisplayMessage[] {
    return messages.map(msg => ({
      id: msg.id,
      senderName: msg.sender,
      role: this.extractRole(msg.sender),
      message: this.stripHtml(msg.text || ''),
      time: msg.timestamp,
      attachmentCount: msg.attachments?.length || 0
    }));
  }

  private mapAttachmentsToDisplay(attachments: MessageAttachment[]): DisplayMessage[] {
    return attachments.map(att => ({
      id: att.id,
      senderName: att.uploadedBy,
      fileName: att.name,
      time: att.uploadedOn,
      fileKey: att.fileKey,
      source: (att as any).source
    }));
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private extractRole(sender: string): string {
    const match = sender.match(/\((.*?)\)/);
    return match ? match[1] : '';
  }

  private async getMessagePageAndEmit(messageId: number): Promise<void> {
    try {
      const pageInfo = await this.discussionService.getMessagePageInfo(messageId, this.pageSize);

      if (pageInfo) {
        this.onItemClick.emit({
          type: this.mode,
          id: messageId,
          data: {
            messageId: messageId,
            parentId: pageInfo.parentId,
            pageNumber: pageInfo.pageNumber,
            totalPages: pageInfo.totalPages
          }
        });
      } else {
        // Fallback - emit without page info
        this.onItemClick.emit({
          type: this.mode,
          id: messageId,
          data: { messageId: messageId }
        });
      }
    } catch (error) {
      console.error('Error getting message page info:', error);
      // Fallback - emit without page info
      this.onItemClick.emit({
        type: this.mode,
        id: messageId,
        data: { messageId: messageId }
      });
    }
  }

  onMessageClick(message: DisplayMessage): void {
    if (this.mode === 'ATTACHMENT') {
      this.viewAttachment(message);
    } else {

      this.getMessagePageAndEmit(message.id);
    }
  }



  private async viewAttachment(message: DisplayMessage): Promise<void> {
    if (!message.fileKey) {
      console.error('No file key provided');
      return;
    }

    try {
      const params = { fileKey: message.fileKey };
      const imageInfo = await this.apiHelperService.getPresignedUrl(params);

      if (imageInfo?.presignedUrl) {
        this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: message.fileName || '',
            requestRid: this.requestRid,
            isTaskView: true,
          },
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          maxWidth: '100vh',
          disableClose: false,
          panelClass: 'dialog-wrapper',
          autoFocus: false,
        });
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  }

  private formatTimestamp(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month} ${day}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
}