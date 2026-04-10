import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef, Input, OnInit, inject, EventEmitter, Output } from '@angular/core';
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
import { DiscussionLogService, ConversationMessage, MessageAttachment } from '../discussion-log.service';
import { TASK_CONVERSATION_ATTACHMENT } from '@admin-core/constants/constants';
import { ETAG } from '@admin-core/constants/api-constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { AuthService } from '@admin-core/services/auth.service';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';




interface UploadedFileData {
  file: File;
  presignedUrl: string;
  fileKey: string;
  originalFileName: string;

}

interface HighlightMessageData {
  messageId: number;
  parentId: number | null;
  pageNumber: number;
  totalPages: number;
}


@Component({
  selector: 'app-discussion-log',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './discussion-log.component.html',
  styleUrl: './discussion-log.component.scss'
})
export class DiscussionLogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() requestRid!: number;
  @Input() readOnly: boolean = false;

  private _highlightMessageData: any = null;
  private pendingHighlightData: HighlightMessageData | null = null;
  private authService = inject(AuthService);


  @Input()
  set highlightMessageData(value: any) {


    this._highlightMessageData = value;

    if (value !== null) {
      this.skipScrollToBottom = true;

      if (value.pageNumber && value.pageNumber !== this.conversationCurrentPage) {

        if (!this.isLoadingPage && !this.conversationLoaded) {

          this.isLoadingPage = true;
          this.conversationLoaded = true;
          this.loadSpecificPageForHighlight(value.pageNumber, value.messageId, value.parentId);
        } else if (this.isInitialLoadComplete && !this.isLoadingPage) {

          this.loadSpecificPageForHighlight(value.pageNumber, value.messageId, value.parentId);
        } else {

          this.pendingHighlightData = value;
        }
      } else if (this.conversationMessages.length > 0) {

        setTimeout(() => {
          this.highlightMessage(value.messageId, value.parentId);
        }, 400);
      } else {

        this.pendingHighlightData = value;
      }
    }
  }


  get highlightMessageData(): any {
    return this._highlightMessageData;
  }
  @Output() attachmentsUpdated = new EventEmitter<MessageAttachment[]>();
  @ViewChild('editorContainer') editorContainer!: ElementRef;

  conversationMessages: ConversationMessage[] = [];
  selectedFiles: File[] = [];
  messageControl = new FormControl('');
  editor!: Editor;
  currentUser: string = 'Current User';
  isReplyMode: boolean = false;
  replyingToMessage: ConversationMessage | null = null;
  replyingToMessageText: string = '';
  private conversationLoaded = false;
  private previousScrollHeight: number = 0;
  private skipScrollToBottom: boolean = false;
  private isInitialLoadComplete = false;
  private isLoadingPage = false;
  isLoadingOlderMessages: boolean = true;
  conversationCurrentPage = 1;
  conversationPageSize = 10;
  conversationTotalPages = 0;
  conversationTotalMessages = 0;
  hasMoreConversationMessages = true;
  isLoadingConversation = false;
  isLoadingMoreConversationMessages = false;

  private isHighlightScrolling: boolean = false;

  isEditMode: boolean = false;
  editingMessageId: number | null = null;
  editingMessageAttachments: MessageAttachment[] = [];
  hoveredMessageId: number | null = null;
  collapsedReplies: Map<number, boolean> = new Map();
  maxVisibleReplies: number = 1;

  uploadedFilesData: UploadedFileData[] = [];
  isSendingMessage: boolean = false;
  fileUploadInProgress: boolean = false;
  attachmentsList: MessageAttachment[] = [];
  showToolbar: boolean = false;
  editingMessageText: string = '';
  editingMessageTimestamp: string = '';

  private cdr = inject(ChangeDetectorRef);
  public dialog = inject(MatDialog);
  private discussionService = inject(DiscussionLogService);
  private apiHelperService = inject(ApiHelperService);
  maxTotalFiles: number = 10;
  warningMessage: string = '';
  showWarning: boolean = false;

  private loadedPageRange = {
    start: 0,
    end: 0
  };



  ngOnInit(): void {
    this.discussionService.setTaskId(this.requestRid);

    this.discussionService.conversationMessages$.subscribe(messages => {
      const previousLength = this.conversationMessages.length;
      this.conversationMessages = messages;

      if (this.pendingHighlightData && messages.length > 0 && previousLength === 0) {
        const data = this.pendingHighlightData;
        this.pendingHighlightData = null;

        setTimeout(() => {
          this.highlightMessage(data.messageId, data.parentId || undefined);
        }, 600);
      }

      this.cdr.detectChanges();
    });

    this.discussionService.paginationInfo$.subscribe(info => {
      this.conversationTotalMessages = info.totalMessages;
      this.conversationTotalPages = info.totalPages;
      this.conversationCurrentPage = info.currentPage;
      this.hasMoreConversationMessages = info.hasNextPage;;
    });


    if (this.requestRid && !this.conversationLoaded && !this.isLoadingPage) {
      this.conversationLoaded = true;

      if (this._highlightMessageData && this._highlightMessageData.pageNumber) {
        this.loadSpecificPageForHighlight(
          this._highlightMessageData.pageNumber,
          this._highlightMessageData.messageId,
          this._highlightMessageData.parentId
        );
      } else {
        this.loadMessages(true);
      }
    }


    setTimeout(() => {
      this.isInitialLoadComplete = true;
    }, 100);
  }


  private async loadSpecificPageForHighlight(pageNumber: number, messageId: number, parentId?: number): Promise<void> {
    this.isLoadingConversation = true;
    this.isLoadingPage = true;
    this.conversationCurrentPage = pageNumber;

    try {
      this.discussionService.clearMessages();

      this.loadedPageRange = { start: 0, end: 0 };

      await new Promise(resolve => setTimeout(resolve, 100));
      await this.discussionService.loadMessages(pageNumber, this.conversationPageSize);


      this.loadedPageRange = { start: pageNumber, end: pageNumber };

      await new Promise(resolve => setTimeout(resolve, 400));
      await this.highlightMessage(messageId, parentId);
    } catch (error) {
      console.error('Error loading page for highlight:', error);
    } finally {
      this.isLoadingConversation = false;
      this.isLoadingPage = false;
    }
  }

  private async highlightMessage(messageId: number, parentId?: number): Promise<void> {
    this.isHighlightScrolling = true;


    if (parentId && parentId > 0) {
      await this.expandParentReplies(parentId);
      await new Promise(resolve => setTimeout(resolve, 300));
    }


    this.expandParentIfNeeded(messageId);

    await new Promise(resolve => setTimeout(resolve, 200));


    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (messageElement) {
      const contentArea = document.querySelector('.discussion-log-tab .overflow-y-auto') as HTMLElement;

      if (contentArea) {
        const messageBottom = messageElement.offsetTop + messageElement.offsetHeight;
        const containerHeight = contentArea.scrollHeight;
        const isNearBottom = (containerHeight - messageBottom) < 200;

        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: isNearBottom ? 'nearest' : 'center',
          inline: 'nearest'
        });
      } else {
        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }

      messageElement.classList.add('message-highlight');
      setTimeout(() => {
        messageElement.classList.remove('message-highlight');
        this._highlightMessageData = null;
        this.skipScrollToBottom = false;
        this.isHighlightScrolling = false;
      }, 2000);
    } else {
      console.error('Message element not found:', messageId);
      this.isHighlightScrolling = false;
    }
  }

  private async expandParentReplies(parentId: number): Promise<void> {
    const parentMessage = this.findMessageById(this.conversationMessages, parentId);

    if (parentMessage && parentMessage.childMessagesCount && parentMessage.childMessagesCount > 0) {
      if (!parentMessage.replies || parentMessage.replies.length === 0) {
        try {
          const children = await this.discussionService.loadChildMessages(parentId);
          parentMessage.replies = children;
        } catch (error) {
          console.error(`Error loading replies for message ${parentId}:`, error);
        }
      }

      this.collapsedReplies.set(parentId, false);
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void {
    this.initEditor();
    this.setupScrollListener();


  }

  ngOnDestroy() {
    const contentArea = document.querySelector('.discussion-log-tab .overflow-y-auto');
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
  }

  private setupScrollListener(): void {
    const contentArea = document.querySelector('.discussion-log-tab .overflow-y-auto');
    if (contentArea) {
      contentArea.addEventListener('scroll', this.onScroll.bind(this));
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
    if (this.isHighlightScrolling || this.isLoadingMoreConversationMessages) {
      return;
    }

    const element = event.target as HTMLElement;
    const threshold = 50;


    if (element.scrollTop <= threshold) {
      const nextOlderPage = this.loadedPageRange.end + 1;


      if (nextOlderPage <= this.conversationTotalPages &&
        !this.isLoadingConversation) {
        this.loadMoreConversationMessages();
      }
    }


    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
    if (isNearBottom) {
      const nextNewerPage = this.loadedPageRange.start - 1;


      if (nextNewerPage >= 1 && !this.isLoadingConversation) {
        this.loadNewerMessages();
      }
    }
  }

  async loadNewerMessages(): Promise<void> {
    const nextNewerPage = this.loadedPageRange.start - 1;


    if (this.isLoadingMoreConversationMessages || nextNewerPage < 1) {
      return;
    }

    const contentArea = document.querySelector('.discussion-log-tab .overflow-y-auto') as HTMLElement;
    if (!contentArea) return;

    const previousScrollHeight = contentArea.scrollHeight;
    const previousScrollTop = contentArea.scrollTop;

    this.isLoadingMoreConversationMessages = true;
    this.isLoadingOlderMessages = false;

    try {
      await this.discussionService.loadMessages(nextNewerPage, this.conversationPageSize);


      this.loadedPageRange.start = nextNewerPage;

      setTimeout(() => {
        const newScrollHeight = contentArea.scrollHeight;
        const heightDifference = newScrollHeight - previousScrollHeight;
        contentArea.scrollTop = previousScrollTop + heightDifference;

        const distanceFromBottom = contentArea.scrollHeight - contentArea.scrollTop - contentArea.clientHeight;
        if (distanceFromBottom < 100) {
          contentArea.scrollTop = contentArea.scrollHeight - contentArea.clientHeight - 150;
        }
      }, 100);
    } catch (error) {
      console.error('Error loading newer messages:', error);
    } finally {
      this.isLoadingMoreConversationMessages = false;
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
          placeholder: 'Add your remark here...',
          showOnlyWhenEditable: true,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content: '',
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
      if (this.editor) {
        this.editor.commands.focus();
      }
    }, 100);
  }

  isCurrentUser(message: ConversationMessage): boolean {

    return message.senderType === 'ADMIN_USER';

  }

  isMessageOwner(message: ConversationMessage): boolean {
    const currentUserId = this.authService.getUserInfo()?.applicationUserId;
    return message.senderUserId === currentUserId;
  }


  public loadConversation(): void {
    if (!this.conversationLoaded && this.requestRid) {
      this.conversationLoaded = true;
      this.loadMessages(true);
    } else if (this.conversationLoaded) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          this.scrollToBottom();
        });
      }, 100);
    }
  }


  private loadMessages(reset: boolean = false): void {
    if (this.isLoadingConversation || !this.requestRid) return;

    if (reset) {
      this.conversationCurrentPage = 1;
      this.hasMoreConversationMessages = true;
      this.isLoadingConversation = true;

      this.loadedPageRange = { start: 0, end: 0 };
    } else {
      this.isLoadingMoreConversationMessages = true;
    }

    const pageToLoad = this.conversationCurrentPage;

    this.discussionService.loadMessages(pageToLoad, this.conversationPageSize)
      .then(() => {
        const paginationInfo = this.discussionService.getPaginationInfo();


        if (this.loadedPageRange.start === 0) {
          this.loadedPageRange = { start: pageToLoad, end: pageToLoad };
        }

        this.hasMoreConversationMessages = pageToLoad < paginationInfo.totalPages;

        if (reset && !this.skipScrollToBottom) {
          setTimeout(() => {
            requestAnimationFrame(() => {
              this.scrollToBottom();
            });
          }, 300);
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
    const nextOlderPage = this.loadedPageRange.end + 1;


    if (this.isLoadingMoreConversationMessages ||
      nextOlderPage > this.conversationTotalPages ||
      !this.requestRid) {
      return;
    }

    const contentArea = document.querySelector('.discussion-log-tab .overflow-y-auto') as HTMLElement;
    if (!contentArea) return;

    const previousScrollHeight = contentArea.scrollHeight;
    const previousScrollTop = contentArea.scrollTop;

    this.isLoadingMoreConversationMessages = true;
    this.isLoadingOlderMessages = true;

    try {
      await this.discussionService.loadMessages(nextOlderPage, this.conversationPageSize);


      this.loadedPageRange.end = nextOlderPage;

      setTimeout(() => {
        const newScrollHeight = contentArea.scrollHeight;
        const heightDifference = newScrollHeight - previousScrollHeight;
        contentArea.scrollTop = previousScrollTop + heightDifference;
      }, 50);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      this.isLoadingMoreConversationMessages = false;
    }
  }

  async loadAllReplies(parentMessage: ConversationMessage): Promise<void> {
    if (!parentMessage.childMessagesCount || parentMessage.childMessagesCount === 0) return;

    try {
      const children = await this.discussionService.loadChildMessages(parentMessage.id);
      parentMessage.replies = children;
      this.collapsedReplies.set(parentMessage.id, false);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  }

  startEditMessage(message: ConversationMessage): void {
    if (!this.editor) return;

    this.isEditMode = true;
    this.editingMessageId = message.id;
    this.editingMessageText = this.getPlainTextFromHtml(message.text || '');
    this.editingMessageTimestamp = message.timestamp;
    this.showToolbar = true;
    this.editor.commands.setContent(message.text || '');
    this.editingMessageAttachments = message.attachments ? [...message.attachments] : [];

    setTimeout(() => this.editor?.commands.focus(), 100);

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
      await this.discussionService.deleteMessageAPI(messageId);
      if (this.editingMessageId === messageId) {
        this.cancelEdit();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  removeEditingAttachment(index: number): void {
    this.editingMessageAttachments.splice(index, 1);
  }

  private cleanupAfterSend(wasNewMessage: boolean, messageId: number | null): void {

    if (this.editor && !this.editor.isDestroyed) {
      this.editor.destroy();
      this.initEditor();
    }


    if (this.editor) {
      this.editor.commands.setContent('');
    }
    this.messageControl.setValue('');
    this.selectedFiles = [];
    this.uploadedFilesData = [];

    this.isEditMode = false;
    this.editingMessageId = null;
    this.editingMessageText = '';
    this.editingMessageTimestamp = '';
    this.editingMessageAttachments = [];
    this.showToolbar = false;
    this.isSendingMessage = false;
    this.isReplyMode = false;
    this.replyingToMessage = null;
    this.replyingToMessageText = '';


    if (this.editorContainer) {
      const wrapper = this.editorContainer.nativeElement.closest('.tiptap-wrapper-with-buttons');
      if (wrapper) {
        wrapper.classList.remove('multiline-content');
      }
    }


    setTimeout(() => {
      if (this.editor && !this.editor.isDestroyed) {
        this.editor.commands.focus();
      }
    }, 100);

    setTimeout(() => this.scrollToBottom(), 150);
  }


  private findRootParentId(message: ConversationMessage | null): number | null {
    if (!message) return null;


    if (message.parentId !== null && message.parentId !== undefined) {
      const allMessages = this.discussionService.getAllMessages();
      const parent = this.findMessageById(allMessages, message.parentId);


      return parent ? this.findRootParentId(parent) : message.parentId;
    }


    return message.id;
  }

  private findMessageById(messages: ConversationMessage[], id: number): ConversationMessage | null {
    for (const message of messages) {
      if (message.id === id) return message;
      if (message.replies && message.replies.length > 0) {
        const found = this.findMessageById(message.replies, id);
        if (found) return found;
      }
    }
    return null;
  }
  private async getPresignedUrlsForFiles(): Promise<void> {
    for (const file of this.selectedFiles) {
      const params = {
        fileName: file.name,
        contentType: file.type,
        purpose: TASK_CONVERSATION_ATTACHMENT,
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
  async sendMessage(): Promise<void> {
    if (!this.editor || this.isSendingMessage || this.fileUploadInProgress) return;

    const content = this.editor.getHTML();
    const textContent = this.getPlainTextFromHtml(content).trim();

    if (!textContent && this.selectedFiles.length === 0 && this.editingMessageAttachments.length === 0) {
      return;
    }

    this.isSendingMessage = true;

    try {
      const processedAttachments: MessageAttachment[] = [];


      if (this.selectedFiles.length > 0) {
        this.fileUploadInProgress = true;


        await this.getPresignedUrlsForFiles();


        for (const uploadedFile of this.uploadedFilesData) {
          const { file, presignedUrl, fileKey } = uploadedFile;

          try {
            const res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);

            if (res && res.headers && res.headers.get(ETAG)) {

              processedAttachments.push({
                id: Date.now() + Math.random(),
                name: uploadedFile.originalFileName,
                size: '',
                uploadedBy: this.currentUser,
                uploadedOn: this.formatTimestamp(new Date()),
                fileKey: fileKey

              });
            } else {
              console.error(`Failed to upload file: ${file.name}`);
            }
          } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error);
          }
        }

        this.fileUploadInProgress = false;
      }

      if (this.isEditMode && this.editingMessageId !== null) {

        const originalMessage = this.findMessageById(this.conversationMessages, this.editingMessageId);
        const originalAttachments = originalMessage?.attachments || [];


        const allAttachments = [...this.editingMessageAttachments, ...processedAttachments];


        await this.discussionService.updateMessageAPI(
          this.editingMessageId,
          {
            text: content,
            attachments: allAttachments
          },
          originalAttachments
        );
      } else {



        const newMessage: ConversationMessage = {
          id: Date.now(),
          sender: this.currentUser,
          senderType: 'ADMIN_USER',
          timestamp: this.formatTimestamp(new Date()),
          text: content,
          isHtml: true,
          attachments: processedAttachments,
          parentId: this.findRootParentId(this.replyingToMessage),
          replies: [],
          messageType: 'Response'
        };

        await this.discussionService.createMessage(newMessage);
      }

      this.cleanupAfterSend(true, null);
    } catch (error) {
      console.error('Error sending message:', error);
      this.isSendingMessage = false;
      this.fileUploadInProgress = false;
    }
  }



  private findMessageInLoadedData(messageId: number): boolean {
    for (const message of this.conversationMessages) {
      if (message.id === messageId) return true;


      if (message.replies && message.replies.length > 0) {
        if (message.replies.some(reply => reply.id === messageId)) {
          return true;
        }
      }
    }
    return false;
  }



  private expandParentIfNeeded(messageId: number): void {

    for (const parentMessage of this.conversationMessages) {
      if (parentMessage.replies && parentMessage.replies.length > 0) {

        const isReplyOfThisParent = parentMessage.replies.some(reply => reply.id === messageId);

        if (isReplyOfThisParent) {

          this.collapsedReplies.set(parentMessage.id, false);
          this.cdr.detectChanges();
          break;
        }
      }
    }
  }



  startReply(message: ConversationMessage): void {
    if (!this.editor) return;

    this.isReplyMode = true;
    this.replyingToMessage = message;


    const plainText = this.getPlainTextFromHtml(message.text || '');
    this.replyingToMessageText = plainText.length > 100
      ? plainText.substring(0, 100) + '...'
      : plainText;

    this.showToolbar = false;


    setTimeout(() => this.editor?.commands.focus(), 100);
  }


  cancelReply(): void {
    this.isReplyMode = false;
    this.replyingToMessage = null;
    this.replyingToMessageText = '';

    if (this.editor && !this.isEditMode) {
      this.editor.commands.setContent('');
      this.messageControl.setValue('');
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
      const contentArea = document.querySelector('.discussion-log-tab .overflow-y-auto');
      if (contentArea) {
        contentArea.scrollTop = contentArea.scrollHeight;
      }
    }, 50);
  }

  isCollapsed(messageId: number): boolean {
    return this.collapsedReplies.get(messageId) ?? false;
  }

  getVisibleReplies(message: ConversationMessage): ConversationMessage[] {
    if (!message.replies || message.replies.length === 0) {
      return [];
    }

    if (!this.collapsedReplies.has(message.id) && message.replies.length > this.maxVisibleReplies) {
      this.collapsedReplies.set(message.id, true);
    }


    const sortedReplies = [...message.replies].sort((a, b) => a.id - b.id);

    if (this.isCollapsed(message.id)) {

      return sortedReplies.slice(-this.maxVisibleReplies);
    }

    return sortedReplies;
  }

  getHiddenRepliesCount(message: ConversationMessage): number {
    if (!message.replies) return 0;
    const hiddenCount = message.replies.length - this.maxVisibleReplies;
    return hiddenCount > 0 ? hiddenCount : 0;
  }

  shouldShowExpandButton(message: ConversationMessage): boolean {
    return message.replies !== undefined &&
      message.replies.length > this.maxVisibleReplies &&
      this.isCollapsed(message.id);
  }

  toggleRepliesExpansion(messageId: number): void {
    const currentState = this.collapsedReplies.get(messageId) ?? false;
    this.collapsedReplies.set(messageId, !currentState);
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
        this.showWarningBanner(`Up to  ${this.maxTotalFiles} files can be uploaded at a time.`);
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

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  async downloadAttachment(attachment: MessageAttachment): Promise<void> {
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


}