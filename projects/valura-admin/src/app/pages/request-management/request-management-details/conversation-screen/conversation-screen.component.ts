import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef, Input, OnInit, inject, EventEmitter, Output, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DSR_CONVERSATION_ATTACHMENT, NOTIFICATION_MESSAGE_TYPE } from '@admin-core/constants/constants';
import { ETAG } from '@admin-core/constants/api-constants';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';
import { Subscription } from 'rxjs';
import { SseService } from '@valura-lib/service/sse/sse.service';
import { NotificationNavigationService } from '@admin-core/services/notification-navigation.service';
import { environment } from '../../../../../environments/environment';

interface Message {
  id: number;
  sender: string;
  senderType: string;
  timestamp: string;
  text: string;
  isHtml?: boolean;
  attachments?: Attachment[];
  isDeleted?: boolean;
}

interface Attachment {
  id: number;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedOn: string;
  fileKey?: string;
}

interface UploadedFileData {
  file: File;
  presignedUrl: string;
  fileKey: string;
  originalFileName: string;
}

@Component({
  selector: 'app-conversation-screen',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './conversation-screen.component.html',
  styleUrl: './conversation-screen.component.scss'
})
export class ConversationScreenComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() requestRid!: number;
  @Input() refreshMessageUpdates: string = '';
  @Input() isRequestClosed: boolean = false;
  @Input() highlightMessageId: number = 0
  @Output() attachmentsUpdated = new EventEmitter<Attachment[]>();
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  conversationMessages: Message[] = [];
  selectedFiles: File[] = [];
  messageControl = new FormControl('');
  editor!: Editor;
  currentUser: string = 'Current User';
  private conversationLoaded = false;

  conversationCurrentPage = 1;
  conversationPageSize = 10;
  conversationTotalPages = 0;
  conversationTotalMessages = 0;
  hasMoreConversationMessages = true;
  isLoadingConversation = false;
  isLoadingMoreConversationMessages = false;

  isEditMode: boolean = false;
  editingMessageId: number | null = null;
  editingMessageAttachments: Attachment[] = [];
  hoveredMessageId: number | null = null;

  uploadedFilesData: UploadedFileData[] = [];
  isSendingMessage: boolean = false;
  fileUploadInProgress: boolean = false;
  attachmentsList: Attachment[] = [];
  showToolbar: boolean = false;
  editingMessageText: string = '';
  editingMessageTimestamp: string = '';
  maxTotalFiles: number = 10;
  warningMessage: string = '';
  showWarning: boolean = false;

  private sseSubscription!: Subscription;
  private apiHelperService = inject(ApiHelperService);
  private cdr = inject(ChangeDetectorRef);
  public dialog = inject(MatDialog);
  private sseService = inject(SseService);
  private notificationNavigationService = inject(NotificationNavigationService);

  ngOnInit(): void {
    this.sseSubscription = this.sseService.connect(environment.sseApi)
      .subscribe(event => {
        this.handleSseEvent(event);
      });

  }



  ngOnChanges(changes: SimpleChanges): void {

    if (changes['isRequestClosed'] && this.editor) {
      this.editor.setEditable(!this.isRequestClosed);
    }
    if (changes['highlightMessageId']?.currentValue) {
      this.waitAndScrollToMessage(changes['highlightMessageId'].currentValue);
    }

    if (changes['refreshMessageUpdates'] && this.refreshMessageUpdates) {
      this.loadConversation();
      return
    }

    if (changes['requestRid'] && !changes['requestRid'].firstChange) {
      const previousRid = changes['requestRid'].previousValue;
      const currentRid = changes['requestRid'].currentValue;
      if (previousRid !== currentRid) {
        this.resetConversationState();
        this.conversationLoaded = true;
        this.loadConversationMessages(true);
      }
    }
  }

  private waitAndScrollToMessage(messageId: number, attempts = 0): void {
    if (attempts > 10) return; // prevent infinite loop

    setTimeout(() => {
      const el = document.querySelector(`[data-message-id="${messageId}"]`);

      if (el) {
        this.scrollToMessage(messageId);
      } else {
        this.waitAndScrollToMessage(messageId, attempts + 1);
      }
    }, 300);
  }


  private resetConversationState(): void {
    this.conversationMessages = [];
    this.conversationCurrentPage = 1;
    this.conversationTotalPages = 0;
    this.conversationTotalMessages = 0;
    this.hasMoreConversationMessages = true;
    this.isLoadingConversation = false;
    this.isLoadingMoreConversationMessages = false;
    this.conversationLoaded = false;


    if (this.editor && !(this.editor as any).isDestroyed) {
      this.editor.commands.setContent('');
      this.messageControl.setValue('');
    }


    if (this.isEditMode) {
      this.cancelEdit();
    }


    this.selectedFiles = [];
    this.uploadedFilesData = [];
    this.attachmentsList = [];
  }

  ngAfterViewInit(): void {
    this.initEditor();
    this.setupScrollListener();
  }

  ngOnDestroy() {
    const contentArea = document.querySelector('.conversation-tab .overflow-y-auto');
    if (contentArea) {
      contentArea.removeEventListener('scroll', this.onScroll.bind(this));
    }

    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
      this.editor = undefined as any;
    }
    if (this.sseSubscription && !this.sseSubscription.closed) {
      this.sseSubscription.unsubscribe();
    }
  }

  private setupScrollListener(): void {
    const contentArea = document.querySelector('.conversation-tab .overflow-y-auto');
    if (contentArea) {
      contentArea.addEventListener('scroll', this.onScroll.bind(this));
    }
  }


  private handleSseEvent(event: any): void {
    try {
      if (event.data === 'Connected!') {
        return;
      }

      const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      const messageType = eventData?.messageType;
      if (messageType == NOTIFICATION_MESSAGE_TYPE.NOTIFICATION_COUNT) {
        const data = { count: eventData?.content }
        this.notificationNavigationService.notificationCountIsUpdated$.next(data);
        return
      }
      if (messageType == NOTIFICATION_MESSAGE_TYPE.RESPONDENT_AS_AUTHOR_SUBMITTED) {
        return
      }
      if (!eventData || !eventData.entityId) {
        console.warn('Invalid SSE event data:', eventData);
        return;
      }

      if (eventData.entityType !== NOTIFICATION_MESSAGE_TYPE.DSR || eventData.entityId !== this.requestRid) {
        return;
      }

      if (eventData.payload?.subEntity !== NOTIFICATION_MESSAGE_TYPE.DSR_CONVERSATION) {
        return;
      }

      const messageId = eventData.payload?.subEntityId;
      if (!messageId) {
        console.warn('No message ID in SSE event:', eventData);
        return;
      }


      switch (eventData.messageType) {
        case 'DELETE':
          this.handleDeleteMessage(messageId, eventData);
          break;
        case 'UPDATE':
          this.handleUpdateMessage(messageId, eventData);
          break;
        case 'CREATE':
          this.handleCreateMessage(messageId, eventData);
          break;
        default:
          console.warn('Unknown message type:', eventData.messageType);
      }

    } catch (error) {
      console.error('Error handling SSE event:', error, event);
    }
  }


  private handleDeleteMessage(messageId: number, eventData: any): void {
    const messageIndex = this.conversationMessages.findIndex(m => m.id === messageId);

    if (messageIndex !== -1) {
      const messageToUpdate = this.conversationMessages[messageIndex];


      this.conversationMessages[messageIndex] = {
        ...messageToUpdate,
        text: 'This message was deleted',
        attachments: [],
        timestamp: this.formatApiTimestamp(eventData.timestamp)
      };


      if (messageToUpdate.attachments && messageToUpdate.attachments.length > 0) {
        messageToUpdate.attachments.forEach(att => {
          this.attachmentsList = this.attachmentsList.filter(a => a.fileKey !== att.fileKey);
        });
        this.attachmentsUpdated.emit(this.attachmentsList);
      }


      if (this.editingMessageId === messageId) {
        this.cancelEdit();
      }

      this.cdr.detectChanges();
    }
  }


  private handleUpdateMessage(messageId: number, eventData: any): void {
    const messageIndex = this.conversationMessages.findIndex(msg => msg.id === messageId);

    if (messageIndex !== -1) {

      const contentMatch = eventData.content?.match(/: (.+)$/);
      const messageContent = contentMatch ? contentMatch[1] : '';


      this.conversationMessages[messageIndex] = {
        ...this.conversationMessages[messageIndex],
        text: messageContent,
        timestamp: this.formatApiTimestamp(eventData.timestamp)
      };


      this.cdr.detectChanges();
    }
  }



  private handleCreateMessage(messageId: number, eventData: any): void {

    const existingMessage = this.conversationMessages.find(m => m.id === messageId);
    if (existingMessage) {
      return;
    }

    const isAtBottom = this.isUserAtBottom();


    const contentParts = eventData.content?.split('\n');
    const senderName = contentParts && contentParts.length > 1 ? contentParts[1].split(':')[0].trim() : 'Unknown';
    const messageContent = contentParts && contentParts.length > 1 ? contentParts[1].substring(contentParts[1].indexOf(':') + 1).trim() : '';


    const senderType = eventData.receiverUser?.includes('ADMIN_USER') ? 'FORM_USER' : 'ADMIN_USER';

    const newMessage: Message = {
      id: messageId,
      sender: senderName,
      senderType: senderType,
      timestamp: this.formatApiTimestamp(eventData.timestamp),
      text: messageContent,
      isHtml: true,
      attachments: []
    };

    this.conversationMessages.push(newMessage);
    this.cdr.detectChanges();

    if (isAtBottom) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }




  dismissWarning(): void {
    this.showWarning = false;
    this.warningMessage = '';
  }

  private showWarningBanner(message: string): void {
    this.warningMessage = message;
    this.showWarning = true;

    setTimeout(() => {
      this.dismissWarning();
    }, 5000);
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 50;

    if (element.scrollTop <= threshold &&
      !this.isLoadingMoreConversationMessages &&
      !this.isLoadingConversation &&
      this.hasMoreConversationMessages) {
      this.loadMoreConversationMessages();
    }
  }

  toggleToolbar(): void {
    this.showToolbar = !this.showToolbar;
    if (this.showToolbar) {
      setTimeout(() => this.editor?.commands.focus(), 100);
    }
  }

  initEditor() {
    if (!this.editorContainer) return;

    this.editor = new Editor({
      element: this.editorContainer.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: false,
          code: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
        }),
        Underline,
        Placeholder.configure({
          placeholder: 'Type your message here...',
          showOnlyWhenEditable: true,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content: '',
      editable: !this.isRequestClosed,
      editorProps: {
        attributes: {
          class: 'tiptap-editor',
        },
      },
      onUpdate: ({ editor }) => {
        this.messageControl.setValue(editor.getHTML());
        this.checkEditorHeight();
      },
    });

    setTimeout(() => {
      if (this.editor && !this.isRequestClosed) {
        this.editor.commands.focus();
      }
    }, 100);
  }

  isCurrentUser(message: Message): boolean {
    return message.senderType === 'ADMIN_USER';
  }

  public loadConversation(): void {
    if (!this.conversationLoaded && this.requestRid) {
      this.conversationLoaded = true;
      this.loadConversationMessages(true);
    } else if (this.conversationLoaded) {

      setTimeout(() => {
        requestAnimationFrame(() => {
          this.scrollToBottom();
        });
      }, 100);
    }
  }

  loadConversationMessages(reset: boolean = false): void {
    if (this.isLoadingConversation || !this.requestRid) return;

    if (reset) {
      this.conversationCurrentPage = 1;
      this.hasMoreConversationMessages = true;
      this.isLoadingConversation = true;
    } else {
      this.isLoadingMoreConversationMessages = true;
    }

    const pageToLoad = this.conversationCurrentPage;

    this.apiHelperService.getConversationMessages(this.requestRid, pageToLoad, this.conversationPageSize)
      .then((response: any) => {
        if (response) {
          this.conversationTotalPages = response.totalPages || 0;
          this.conversationTotalMessages = response.totalMessages || 0;
          this.hasMoreConversationMessages = pageToLoad < this.conversationTotalPages;

          const newMessages = this.transformApiMessages(response.messages || []);

          if (reset) {
            this.conversationMessages = newMessages;
          } else {
            this.conversationMessages = [...newMessages, ...this.conversationMessages];
          }

          this.extractAttachmentsFromMessages();

          if (reset) {

            setTimeout(() => {
              requestAnimationFrame(() => {
                this.scrollToBottom();
              });
            }, 300);
          }
        }
      })
      .catch((error) => {
        console.error('Error loading messages:', error);
        this.hasMoreConversationMessages = false;
      })
      .finally(() => {
        this.isLoadingConversation = false;
        this.isLoadingMoreConversationMessages = false;
      });
  }

  async loadMoreConversationMessages(): Promise<void> {
    if (this.isLoadingMoreConversationMessages ||
      !this.hasMoreConversationMessages ||
      !this.requestRid) {
      return;
    }

    this.conversationCurrentPage++;
    await this.loadConversationMessages(false);
  }

  private transformApiMessages(apiMessages: any[]): Message[] {
    if (!apiMessages || apiMessages.length === 0) return [];

    return apiMessages.reverse().map((msg) => {
      return {
        id: msg.messageId,
        sender: msg.senderName || 'Unknown',
        senderType: msg.senderType,
        timestamp: this.formatApiTimestamp(msg.timestamp),
        text: msg.messageContent || '',
        isHtml: !!msg.messageContent,
        attachments: this.transformAttachments(msg.attachments, msg.senderName, msg.timestamp),
        isDeleted: msg.isDeleted
      };
    });
  }

  private transformAttachments(apiAttachments: any[], senderName: string, timestamp: string): Attachment[] {
    if (!apiAttachments || apiAttachments.length === 0) {
      return [];
    }

    return apiAttachments.map((att, index) => ({
      id: Date.now() + index,
      name: att.fileName || 'Unknown file',
      size: 'Unknown',
      uploadedBy: senderName || 'Unknown',
      uploadedOn: this.formatApiTimestamp(timestamp),
      fileKey: att.fileKey
    }));
  }

  private extractDisplayName(fileName: string): string {
    if (!fileName) return 'Unknown file';
    const parts = fileName.split('/');
    return parts[parts.length - 1];
  }

  private extractAttachmentsFromMessages(): void {
    this.attachmentsList = [];
    this.conversationMessages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          if (!this.attachmentsList.find(a => a.fileKey === att.fileKey)) {
            this.attachmentsList.push(att);
          }
        });
      }
    });
    this.attachmentsUpdated.emit(this.attachmentsList);
  }

  private extractFileNameFromString(str: string): string {
    try {
      const match = str.match(/"fileName":"([^"]+)"/);
      if (match && match[1]) {
        return this.extractDisplayName(match[1]);
      }
      return 'Unknown file';
    } catch {
      return 'Unknown file';
    }
  }

  private formatApiTimestamp(timestamp: string): string {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      return `${month} ${day}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  }

  startEditMessage(message: Message): void {
    if (!this.editor) return;

    this.isEditMode = true;
    this.editingMessageId = message.id;
    this.editingMessageText = this.getPlainTextFromHtml(message.text || '');
    this.editingMessageTimestamp = message.timestamp;
    this.showToolbar = true;
    this.editor.commands.setContent(message.text || '');
    this.editingMessageAttachments = message.attachments ? [...message.attachments] : [];

    setTimeout(() => this.editor?.commands.focus(), 100);


    this.scrollToMessage(message.id);
  }

  cancelEdit(): void {
    this.showToolbar = false;
    this.isEditMode = false;
    this.editingMessageId = null;
    this.editingMessageText = '';
    this.editingMessageTimestamp = '';
    this.editingMessageAttachments = [];
    this.selectedFiles = [];
    this.uploadedFilesData = [];

    if (this.editor) {
      this.editor.commands.setContent('');
      this.messageControl.setValue('');
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    try {
      const result = await this.apiHelperService.deleteConversationMessage(
        this.requestRid,
        messageId
      );

      if (result) {

        const messageIndex = this.conversationMessages.findIndex(m => m.id === messageId);

        if (messageIndex !== -1) {
          const messageToUpdate = this.conversationMessages[messageIndex];


          this.conversationMessages[messageIndex] = {
            ...messageToUpdate,
            text: 'This message was deleted',
            isDeleted: true,
            attachments: []
          };


          if (messageToUpdate.attachments && messageToUpdate.attachments.length > 0) {
            messageToUpdate.attachments.forEach(att => {
              this.attachmentsList = this.attachmentsList.filter(a => a.fileKey !== att.fileKey);
            });
          }
        }

        this.cdr.detectChanges();
        this.attachmentsUpdated.emit(this.attachmentsList);

        if (this.editingMessageId === messageId) {
          this.cancelEdit();
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  removeEditingAttachment(index: number): void {
    this.editingMessageAttachments.splice(index, 1);
  }

  async sendMessage(): Promise<void> {
    if (!this.editor || this.isSendingMessage || this.fileUploadInProgress) return;

    const content = this.editor.getHTML();
    const textContent = this.getPlainTextFromHtml(content).trim();

    const hasText = !!textContent;
    const hasFiles = this.selectedFiles.length > 0;
    const hasExistingAttachments = this.editingMessageAttachments.length > 0;

    if (!hasText && !hasFiles && !hasExistingAttachments) {
      return;
    }

    if (!this.requestRid || isNaN(this.requestRid)) {
      console.error('Invalid requestRid:', this.requestRid);
      return;
    }

    const messageIdToUpdate = this.editingMessageId;
    this.isSendingMessage = true;

    try {
      const processedAttachments: any[] = [];

      if (this.isEditMode && this.editingMessageAttachments.length > 0) {
        this.editingMessageAttachments.forEach(att => {
          if (att.fileKey) {
            processedAttachments.push({
              fileKey: att.fileKey,
              fileName: att.name
            });
          }
        });
      }

      if (hasFiles) {
        await this.getPresignedUrlsForFiles();

        for (const uploadedFile of this.uploadedFilesData) {
          const { file, presignedUrl, fileKey } = uploadedFile;
          const res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
          if (res && res.headers && res.headers.get(ETAG)) {
            processedAttachments.push({
              fileKey: fileKey,
              fileName: uploadedFile.originalFileName
            });
          } else {
            console.error(`Failed to upload file: ${file.name}`);
          }
        }
      }

      const body = {
        messageContent: hasText ? content : '',
        attachments: processedAttachments
      };

      let result;
      if (this.isEditMode && this.editingMessageId) {
        result = await this.apiHelperService.updateConversationMessage(
          this.requestRid,
          this.editingMessageId,
          body
        );

        if (result) {
          const messageIndex = this.conversationMessages.findIndex(m => m.id === messageIdToUpdate);
          if (messageIndex !== -1) {
            this.conversationMessages[messageIndex].text = content;


            const allAttachments: Attachment[] = [...this.editingMessageAttachments];


            this.uploadedFilesData.forEach(uploadedFile => {
              allAttachments.push({
                id: Date.now() + Math.random(),
                name: uploadedFile.originalFileName,
                size: this.formatFileSize(uploadedFile.file.size),
                uploadedBy: this.currentUser,
                uploadedOn: this.formatTimestamp(new Date()),
                fileKey: uploadedFile.fileKey
              });
            });

            this.conversationMessages[messageIndex].attachments = allAttachments;


            allAttachments.forEach(att => {
              if (!this.attachmentsList.find(a => a.fileKey === att.fileKey)) {
                this.attachmentsList.push(att);
              }
            });


            this.attachmentsUpdated.emit(this.attachmentsList);
          }
        }
      } else {
        result = await this.apiHelperService.postConversationMessage(this.requestRid, body);

        if (result) {
          const isAtBottom = this.isUserAtBottom();

          try {

            const latestResponse: any = await this.apiHelperService.getConversationMessages(
              this.requestRid,
              1,
              1
            );

            if (latestResponse?.messages && latestResponse.messages.length > 0) {
              const latestMsg = latestResponse.messages[0];

              const newMessage: Message = {
                id: latestMsg.messageId,
                sender: latestMsg.senderName || 'You',
                senderType: latestMsg.senderType,
                timestamp: this.formatApiTimestamp(latestMsg.timestamp),
                text: latestMsg.messageContent || '',
                isHtml: true,
                attachments: this.transformAttachments(
                  latestMsg.attachments || [],
                  latestMsg.senderName,
                  latestMsg.timestamp
                )
              };


              const isDuplicate = this.conversationMessages.some(m => m.id === newMessage.id);
              if (!isDuplicate) {
                this.conversationMessages.push(newMessage);


                if (latestMsg.attachments && latestMsg.attachments.length > 0) {
                  const newAttachments = this.transformAttachments(
                    latestMsg.attachments,
                    latestMsg.senderName,
                    latestMsg.timestamp
                  );

                  newAttachments.forEach(att => {
                    if (!this.attachmentsList.find(a => a.fileKey === att.fileKey)) {
                      this.attachmentsList.push(att);
                    }
                  });
                }
              }

              this.cdr.detectChanges();
              this.attachmentsUpdated.emit(this.attachmentsList);

              if (isAtBottom) {
                setTimeout(() => this.scrollToBottom(), 50);
              }
            }
          } catch (error) {
            console.error('Error fetching latest message:', error);
          }
        }
      }

      if (result) {
        this.extractAttachmentsFromMessages();

        if (this.editor && !this.editor.isDestroyed) {
          this.editor.destroy();
          this.initEditor();
        }
        setTimeout(() => this.checkEditorHeight(), 0);
        this.messageControl.setValue('');
        this.selectedFiles = [];
        this.uploadedFilesData = [];

        const wasEditMode = this.isEditMode;
        this.isEditMode = false;
        this.editingMessageId = null;
        this.editingMessageText = '';
        this.editingMessageTimestamp = '';
        this.editingMessageAttachments = [];
        this.showToolbar = false;

        setTimeout(() => this.editor?.commands.focus(), 100);


        if (wasEditMode && messageIdToUpdate) {
          setTimeout(() => this.scrollToMessage(messageIdToUpdate), 200);
        } else {
          setTimeout(() => this.scrollToBottom(), 150);
        }
      }
    } catch (error) {
      console.error('Error sending/updating message:', error);
    } finally {
      this.isSendingMessage = false;
    }
  }


  scrollToMessage(messageId: number): void {
    setTimeout(() => {
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });


        messageElement.classList.add('message-highlight');
        setTimeout(() => {
          messageElement.classList.remove('message-highlight');
        }, 2000);
      }
    }, 100);
  }

  private async reloadCurrentMessages(): Promise<void> {
    try {
      this.conversationCurrentPage = 1;
      await this.loadConversationMessages(true);
    } catch (error) {
      console.error('Error reloading messages:', error);
    }
  }

  private async getPresignedUrlsForFiles(): Promise<void> {
    for (const file of this.selectedFiles) {
      const params = {
        fileName: file.name,
        contentType: file.type,
        purpose: DSR_CONVERSATION_ATTACHMENT,
      };

      try {
        const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);

        if (imageInfo) {
          const fileData: UploadedFileData = {
            file,
            presignedUrl: imageInfo.presignedUrl,
            fileKey: imageInfo.fileKey,
            originalFileName: file.name
          };

          this.uploadedFilesData.push(fileData);
        }
      } catch (error) {
        console.error('Error getting presigned URL for file:', file.name, error);
      }
    }
  }

  toggleBold(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleBold().run();
    this.cdr.detectChanges();
  }

  toggleItalic(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleItalic().run();
    this.cdr.detectChanges();
  }

  toggleUnderline(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleUnderline().run();
    this.cdr.detectChanges();
  }

  toggleBulletList(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleBulletList().run();
    this.cdr.detectChanges();
  }

  toggleOrderedList(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleOrderedList().run();
    this.cdr.detectChanges();
  }

  isActive(format: string): boolean {
    if (!this.editor || (this.editor as any).isDestroyed) {
      return false;
    }
    try {
      return this.editor.isActive(format);
    } catch {
      return false;
    }
  }

  getPlainTextFromHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  formatTimestamp(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month} ${day}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const contentArea = document.querySelector('.conversation-tab .overflow-y-auto');
      if (contentArea) {
        contentArea.scrollTop = contentArea.scrollHeight;
      }
    }, 50);
  }

  attachFiles(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = (event: any) => this.onFileSelected(event);
    fileInput.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const maxSizeInBytes = 5 * 1024 * 1024;

      const totalExistingFiles = this.selectedFiles.length + this.editingMessageAttachments.length;

      if (totalExistingFiles >= this.maxTotalFiles) {
        this.showWarningBanner(`Maximum ${this.maxTotalFiles} files allowed. You already have ${totalExistingFiles} files.`);
        input.value = '';
        return;
      }

      const remainingSlots = this.maxTotalFiles - totalExistingFiles;

      if (input.files.length > remainingSlots) {
        this.showWarningBanner(`Up to ${this.maxTotalFiles} files can be uploaded at a time.`);
        input.value = '';
        return;
      }

      let addedCount = 0;
      let skippedDuplicates: string[] = [];
      let skippedLarge: string[] = [];

      for (let i = 0; i < input.files.length && addedCount < remainingSlots; i++) {
        const file = input.files[i];

        if (file.size > maxSizeInBytes) {
          skippedLarge.push(file.name);
          continue;
        }

        const isDuplicateInSelected = this.selectedFiles.some(
          existingFile => existingFile.name === file.name && existingFile.size === file.size
        );

        const isDuplicateInEditing = this.editingMessageAttachments.some(
          attachment => attachment.name === file.name
        );

        if (isDuplicateInSelected || isDuplicateInEditing) {
          skippedDuplicates.push(file.name);
          continue;
        }

        this.selectedFiles.push(file);
        addedCount++;
      }

      if (skippedLarge.length > 0) {
        this.showWarningBanner(`Files exceeding 5MB limit (skipped): ${skippedLarge.join(', ')}`);
      }

      if (skippedDuplicates.length > 0) {
        this.showWarningBanner(`This file is already attached to your message`);
      }

      input.value = '';
    }
  }
  private checkEditorHeight(): void {
    if (!this.editorContainer) return;

    const editorElement = this.editorContainer.nativeElement;
    const wrapper = editorElement.closest('.tiptap-wrapper-with-buttons');

    if (wrapper && !this.showToolbar) {
      const content = editorElement.querySelector('.tiptap-editor');
      if (content) {
        const paragraphs = content.querySelectorAll('p');
        const textContent = content.textContent?.trim() || '';


        const hasMultipleLines = paragraphs.length > 1 || content.querySelector('br');
        const isEmpty = textContent.length === 0;

        if (hasMultipleLines && !isEmpty) {
          wrapper.classList.add('multiline-content');
        } else {
          wrapper.classList.remove('multiline-content');
        }
      }
    }
  }
  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  async downloadAttachment(attachment: Attachment): Promise<void> {
    if (!attachment.fileKey) {
      console.error('No file key provided');
      return;
    }

    try {
      const params = {
        fileKey: attachment.fileKey,
      };

      const imageInfo = await this.apiHelperService.getPresignedUrl(params);

      if (imageInfo?.presignedUrl) {
        const dialogRef = this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: attachment.name || '',
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
      } else {
        console.error('Failed to get presigned URL');
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);
    }
  }
  private isUserAtBottom(): boolean {
    const contentArea = document.querySelector('.conversation-tab .overflow-y-auto');
    if (!contentArea) return false;

    const threshold = 50;
    const position = contentArea.scrollTop + contentArea.clientHeight;
    const height = contentArea.scrollHeight;

    return position >= height - threshold;
  }
}