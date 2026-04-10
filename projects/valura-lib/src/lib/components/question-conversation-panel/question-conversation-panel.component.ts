import {
  Component, ElementRef, EventEmitter, Input, Output,
  ViewChild, OnDestroy, OnChanges, SimpleChanges,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { SafeHtmlPipe } from '@valura-lib/components//safe-html.pipe';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { AuthService } from '@admin-core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { QUESTIONNAIRE_CONVERSATION_ATTACHMENT } from 'app/core/constants/constants';
import { DocViewerDialogComponent } from @admin - page / request - management / request - management - dialog / doc - viewer - dialog / doc - viewer - dialog.component';
import { ETAG } from 'app/core/constants/api-constants';
import {
  PostMessageCommand, DeleteMessageCommand, UpdateMessageCommand,
  ConversationCommandType
} from '@admin-core/models/assessment/conversation.model';

interface MessageAttachment {
  id: number;
  name: string;
  fileKey?: string;
  size?: string;
}

export interface ConversationMessage {
  id: number;
  sender: string;
  senderType: string;
  senderUserId?: number;
  messageType: 'Remark' | 'Response';
  timestamp: string;
  text: string;
  attachments?: MessageAttachment[];
  replies?: ConversationMessage[];
  parentId?: number | null;
  isDeleted?: boolean;
  childConversationsCount?: number;
}

@Component({
  selector: 'app-question-conversation-panel',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatCardModule, MatButtonModule,
    LoadingButtonComponent, SafeHtmlPipe
  ],
  templateUrl: './question-conversation-panel.component.html',
  styleUrl: './question-conversation-panel.component.scss'
})
export class QuestionConversationPanelComponent implements OnDestroy, OnChanges {
  @Input() assessmentId: number = 0;
  @Input() questionId: number = 0;
  @Input() sectionId: number = 0;
  @Input() sectionTitle: string = '';
  @Input() questionTitle: string = '';
  @Input() helperText: string = '';
  @Input() displayQuestionId: number | string = '';

  @Output() onMessageSent = new EventEmitter<void>();

  @ViewChild('questionEditorContainer') questionEditorContainer!: ElementRef;

  questionEditor: Editor | undefined;
  dropDownOpen = false;
  showFullQuestionDetails = false;
  questionMessages: ConversationMessage[] = [];
  isLoadingQuestionMessages = false;
  showQuestionChat = false;
  questionMessagePage = 0;
  hasMoreQuestionMessages = false;
  isLoadingMoreQuestionMessages = false;
  questionShowToolbar = false;
  questionSelectedFiles: File[] = [];
  questionIsReplyMode = false;
  questionReplyingToMessage: ConversationMessage | null = null;
  questionReplyingToMessageText = '';
  questionIsSendingMessage = false;
  hoveredMessageId: number | null = null;
  isEditMode = false;
  editingMessageId: number | null = null;
  isSendingMessage = false;
  maxTotalFiles = 10;
  maxVisibleReplies = 1;
  collapsedReplies = new Map<number, boolean>();

  private cdr = inject(ChangeDetectorRef);
  private snackbarService = inject(SnackbarService);
  private apiHelperService = inject(ApiHelperService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questionId'] || changes['sectionId']) {
      this.resetState();
    }
  }

  ngOnDestroy(): void {
    this.questionEditor?.destroy();
  }

  resetState(): void {
    this.dropDownOpen = false;
    this.showFullQuestionDetails = false;
    this.showQuestionChat = false;
    this.questionMessages = [];
    this.questionMessagePage = 0;
    this.hasMoreQuestionMessages = false;
    this.questionShowToolbar = false;
    this.questionSelectedFiles = [];
    this.questionIsReplyMode = false;
    this.questionReplyingToMessage = null;
    this.questionReplyingToMessageText = '';
    this.questionIsSendingMessage = false;
    this.isEditMode = false;
    this.editingMessageId = null;
    this.collapsedReplies.clear();
    if (this.questionEditor) {
      this.questionEditor.destroy();
      this.questionEditor = undefined;
    }
  }

  toggleDropdown(): void {
    this.dropDownOpen = !this.dropDownOpen;
    this.showFullQuestionDetails = false;
    if (this.dropDownOpen && this.showFullQuestionDetails) {
      this.cdr.detectChanges();
      setTimeout(() => this.initQuestionEditor(), 0);
    }
  }

  async viewFullQuestionDetails(): Promise<void> {
    this.showFullQuestionDetails = true;
    this.cdr.detectChanges();
    setTimeout(() => this.initQuestionEditor(), 0);
    await this.loadQuestionMessages();
  }

  toggleQuestionChat(): void {
    this.showQuestionChat = !this.showQuestionChat;
    if (this.showQuestionChat && this.questionMessages.length === 0) {
      this.loadQuestionMessages();
    }
  }

  onMessagesScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (atBottom && this.hasMoreQuestionMessages && !this.isLoadingMoreQuestionMessages) {
      this.loadMoreQuestionMessages();
    }
  }

  isCurrentUser(message: ConversationMessage): boolean {
    return message.senderType === 'ADMIN_USER';
  }

  isMessageOwner(message: ConversationMessage): boolean {
    const currentUserId = this.authService.getUserInfo()?.applicationUserId;
    return message.senderUserId === currentUserId;
  }

  startQuestionReply(message: ConversationMessage): void {
    this.questionIsReplyMode = true;
    this.questionReplyingToMessage = message;
    const plainText = message.text.replace(/<[^>]*>/g, '');
    this.questionReplyingToMessageText = plainText.length > 100
      ? plainText.substring(0, 100) + '...'
      : plainText;
  }

  cancelQuestionReply(): void {
    this.questionIsReplyMode = false;
    this.questionReplyingToMessage = null;
    this.questionReplyingToMessageText = '';
  }

  startEdit(messageId: number): void {
    const message = this.findMessageById(messageId);
    if (!message) return;

    this.isEditMode = true;
    this.editingMessageId = messageId;
    this.questionEditor?.commands.setContent(message.text);
    this.questionIsReplyMode = false;
    this.questionReplyingToMessage = null;
    this.questionReplyingToMessageText = '';

    setTimeout(() => {
      this.questionEditorContainer?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.questionEditor?.commands.focus();
    }, 100);
  }

  cancelEdit(): void {
    this.questionShowToolbar = false;
    this.isEditMode = false;
    this.editingMessageId = null;
    this.questionSelectedFiles = [];
    if (this.questionEditor) {
      this.questionEditor.commands.setContent('');
    }
  }

  toggleQuestionToolbar(): void {
    this.questionShowToolbar = !this.questionShowToolbar;
    if (this.questionShowToolbar) {
      setTimeout(() => this.questionEditor?.commands.focus(), 100);
    }
  }

  toggleQuestionFormat(format: string): void {
    if (!this.questionEditor || (this.questionEditor as any).isDestroyed) return;
    switch (format) {
      case 'bold': this.questionEditor.chain().focus().toggleBold().run(); break;
      case 'italic': this.questionEditor.chain().focus().toggleItalic().run(); break;
      case 'underline': this.questionEditor.chain().focus().toggleUnderline().run(); break;
      case 'bulletList': this.questionEditor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList': this.questionEditor.chain().focus().toggleOrderedList().run(); break;
    }
    this.cdr.detectChanges();
  }

  isQuestionEditorActive(format: string): boolean {
    if (!this.questionEditor || (this.questionEditor as any).isDestroyed) return false;
    try {
      return this.questionEditor.isActive(format);
    } catch {
      return false;
    }
  }

  attachQuestionFiles(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = (event: any) => this.handleFileSelection(event);
    fileInput.click();
  }

  removeQuestionSelectedFile(index: number): void {
    this.questionSelectedFiles.splice(index, 1);
  }

  async sendQuestionMessage(): Promise<void> {
    if (!this.questionEditor || this.questionIsSendingMessage) return;

    const content = this.questionEditor.getHTML();
    const textContent = this.getPlainTextFromHtml(content).trim();

    if (!textContent && this.questionSelectedFiles.length === 0) return;
    if (!this.questionId) return;

    this.questionIsSendingMessage = true;
    try {
      if (this.isEditMode && this.editingMessageId) {
        const updateSubCommands: UpdateMessageCommand['commands'] = [];
        updateSubCommands.push({ type: 'updateMessageContent', message: content });

        const processedAttachments = await this.uploadFiles(this.questionSelectedFiles);
        if (processedAttachments.length > 0) {
          updateSubCommands.push({ type: 'addMessageAttachments', attachments: processedAttachments });
        }

        const command: UpdateMessageCommand = {
          type: 'updateMessage',
          commands: updateSubCommands
        };
        await this.assessmentApiHelperService.updateQuestionConversation(
          this.assessmentId, this.questionId, this.editingMessageId, [command]
        );
      } else {
        const processedAttachments = await this.uploadFiles(this.questionSelectedFiles);
        const command: PostMessageCommand = {
          type: 'postMessage',
          message: content,
          messageParentId: this.questionIsReplyMode && this.questionReplyingToMessage
            ? (this.questionReplyingToMessage.parentId || this.questionReplyingToMessage.id)
            : 0,
          attachments: processedAttachments
        };
        await this.assessmentApiHelperService.createQuestionConversation(
          this.assessmentId, this.questionId, [command]
        );
      }

      this.questionEditor.commands.setContent('');
      this.questionSelectedFiles = [];
      this.isEditMode = false;
      this.editingMessageId = null;
      this.questionIsReplyMode = false;
      this.questionReplyingToMessage = null;
      this.questionReplyingToMessageText = '';
      this.snackbarService.openSnack('Message sent successfully', 'success');
      await this.loadQuestionMessages();
      this.onMessageSent.emit();
    } catch (error) {
      console.error('Error sending question message:', error);
      this.snackbarService.openSnack(this.isEditMode ? 'Failed to update message' : 'Failed to send message', 'error');
    } finally {
      this.questionIsSendingMessage = false;
      this.cdr.detectChanges();
    }
  }

  async deleteQuestionMessage(messageId: number): Promise<void> {
    if (!this.questionId) return;

    try {
      const command: DeleteMessageCommand = {
        type: ConversationCommandType.DELETE_MESSAGE as 'deleteMessage',
        messageId
      };
      await this.assessmentApiHelperService.updateQuestionConversation(
        this.assessmentId, this.questionId, messageId, [command]
      );
      await this.loadQuestionMessages();
    } catch (e) {
      console.error('Error deleting message:', e);
      this.snackbarService.openSnack('Failed to delete message', 'error');
    }
  }

  async downloadAttachment(attachment: MessageAttachment): Promise<void> {
    if (!attachment.fileKey) return;

    try {
      const params = { fileKey: attachment.fileKey };
      const imageInfo = await this.apiHelperService.getPresignedUrl(params);
      if (imageInfo?.presignedUrl) {
        this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: attachment.name || '',
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
      console.error('Error downloading attachment:', error);
      this.snackbarService.openSnack('Failed to download attachment', 'error');
    }
  }

  getVisibleReplies(message: ConversationMessage): ConversationMessage[] {
    if (!message.replies) return [];
    const isCollapsed = this.collapsedReplies.get(message.id) !== false;
    if (isCollapsed && message.replies.length > this.maxVisibleReplies) {
      return message.replies.slice(message.replies.length - this.maxVisibleReplies);
    }
    return message.replies;
  }

  getHiddenRepliesCount(message: ConversationMessage): number {
    if (!message.replies) return 0;
    return message.replies.length - this.maxVisibleReplies;
  }

  shouldShowExpandButton(message: ConversationMessage): boolean {
    if (!message.replies) return false;
    const isCollapsed = this.collapsedReplies.get(message.id) !== false;
    return isCollapsed && message.replies.length > this.maxVisibleReplies;
  }

  toggleRepliesExpansion(messageId: number): void {
    this.collapsedReplies.set(messageId, false);
  }

  // --- Private methods ---

  private initQuestionEditor(retries = 3): void {
    if (!this.questionEditorContainer) {
      if (retries > 0) {
        this.cdr.detectChanges();
        setTimeout(() => this.initQuestionEditor(retries - 1), 50);
      }
      return;
    }
    this.questionEditor = this.createEditor(this.questionEditorContainer.nativeElement);
  }

  private createEditor(element: HTMLElement): Editor {
    const editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          heading: false, code: false, codeBlock: false,
          blockquote: false, horizontalRule: false,
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
        attributes: { class: 'tiptap-editor' },
      },
    });
    setTimeout(() => editor?.commands.focus(), 100);
    return editor;
  }

  private async loadQuestionMessages(): Promise<void> {
    if (!this.questionId || !this.sectionId) return;

    this.questionMessagePage = 0;
    this.isLoadingQuestionMessages = true;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: this.sectionId,
          questionId: this.questionId,
          messagePage: 0,
          messageLimit: 10
        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === this.sectionId);
      const q = sec?.question?.find((q: any) => q.questionId === this.questionId);
      if (q) {
        const messages = (q.messages || []).map((m: any) => this.mapApiMessage(m));
        for (const message of messages) {
          if (message.childConversationsCount && message.childConversationsCount > 0) {
            try {
              const childRes = await this.assessmentApiHelperService.getAssessmentSectionDetail(
                this.assessmentId,
                {
                  sectionId: this.sectionId,
                  questionId: this.questionId,
                  messagePage: 0,
                  messageLimit: 50,
                  conversationId: message.id,
                  depthOfChildMessageCount: message.childConversationsCount
                }
              );
              const childSec = childRes?.sectionResponses?.find((s: any) => s.sectionId === this.sectionId);
              const childQ = childSec?.question?.find((cq: any) => cq.questionId === this.questionId);
              if (childQ?.messages) {
                const childMessages = (childQ.messages || []).map((m: any) => this.mapApiMessage(m));
                message.replies = childMessages.filter((m: ConversationMessage) => m.parentId === message.id);
              }
            } catch (error) {
              console.error(`Error loading children for question message ${message.id}:`, error);
            }
          }
        }
        this.questionMessages = this.buildMessageTree(messages);
        this.hasMoreQuestionMessages = messages.length === 10;
      }
    } catch (e) {
      console.error('Error loading question messages:', e);
    } finally {
      this.isLoadingQuestionMessages = false;
      this.cdr.detectChanges();
    }
  }

  private async loadMoreQuestionMessages(): Promise<void> {
    if (this.isLoadingMoreQuestionMessages || !this.hasMoreQuestionMessages) return;
    if (!this.questionId || !this.sectionId) return;

    this.isLoadingMoreQuestionMessages = true;
    this.questionMessagePage++;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: this.sectionId,
          questionId: this.questionId,
          messagePage: this.questionMessagePage,
          messageLimit: 10
        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === this.sectionId);
      const q = sec?.question?.find((q: any) => q.questionId === this.questionId);
      if (q) {
        const newMessages = (q.messages || []).map((m: any) => this.mapApiMessage(m));
        for (const message of newMessages) {
          if (message.childConversationsCount && message.childConversationsCount > 0) {
            try {
              const childRes = await this.assessmentApiHelperService.getAssessmentSectionDetail(
                this.assessmentId,
                {
                  sectionId: this.sectionId,
                  questionId: this.questionId,
                  messagePage: 0,
                  messageLimit: 50,
                  conversationId: message.id,
                  depthOfChildMessageCount: message.childConversationsCount
                }
              );
              const childSec = childRes?.sectionResponses?.find((s: any) => s.sectionId === this.sectionId);
              const childQ = childSec?.question?.find((cq: any) => cq.questionId === this.questionId);
              if (childQ?.messages) {
                const childMessages = (childQ.messages || []).map((m: any) => this.mapApiMessage(m));
                message.replies = childMessages.filter((m: ConversationMessage) => m.parentId === message.id);
              }
            } catch (error) {
              console.error(`Error loading children for question message ${message.id}:`, error);
            }
          }
        }
        this.hasMoreQuestionMessages = newMessages.length === 10;
        const existingFlat = this.flattenMessages(this.questionMessages);
        this.questionMessages = this.buildMessageTree([...existingFlat, ...newMessages]);
      } else {
        this.hasMoreQuestionMessages = false;
      }
    } catch (e) {
      console.error('Error loading more question messages:', e);
      this.questionMessagePage--;
    } finally {
      this.isLoadingMoreQuestionMessages = false;
      this.cdr.detectChanges();
    }
  }

  private mapApiMessage(m: any): ConversationMessage {
    return {
      id: m.messageId,
      text: m.message,
      sender: m.senderName,
      senderType: m.senderType,
      senderUserId: m.createdBy,
      messageType: m.discussionType === 'RESPONSE' ? 'Response' : 'Remark',
      timestamp: m.createdAt,
      attachments: (m.attachments || []).map((a: any) => ({
        id: a.id,
        name: a.fileName,
        fileKey: a.fileKey,
        size: a.fileSize
      })),
      replies: [],
      parentId: (m.parentId === 0 || m.parentId === null || m.parentId === undefined) ? null : m.parentId,
      isDeleted: m.isDeleted ?? false,
      childConversationsCount: m.childConversationsCount ?? 0
    };
  }

  private buildMessageTree(messages: ConversationMessage[]): ConversationMessage[] {
    const messageMap = new Map<number, ConversationMessage>();
    const rootMessages: ConversationMessage[] = [];

    messages.forEach(m => {
      if (!m.replies || m.replies.length === 0) {
        m.replies = [];
      }
      messageMap.set(m.id, m);
    });

    messages.forEach(m => {
      if (m.parentId) {
        const parent = messageMap.get(m.parentId);
        if (parent) {
          parent.replies!.push(m);
        } else {
          rootMessages.push(m);
        }
      } else {
        rootMessages.push(m);
      }
    });

    return rootMessages.sort((a, b) => a.id - b.id);
  }

  private flattenMessages(messages: ConversationMessage[]): ConversationMessage[] {
    const flat: ConversationMessage[] = [];
    for (const msg of messages) {
      flat.push({ ...msg, replies: [] });
      if (msg.replies && msg.replies.length > 0) {
        flat.push(...this.flattenMessages(msg.replies));
      }
    }
    return flat;
  }

  private findMessageById(id: number): ConversationMessage | undefined {
    for (const msg of this.questionMessages) {
      if (msg.id === id) return msg;
      if (msg.replies) {
        const reply = msg.replies.find(r => r.id === id);
        if (reply) return reply;
      }
    }
    return undefined;
  }

  private handleFileSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (this.questionSelectedFiles.length >= this.maxTotalFiles) {
      input.value = '';
      return;
    }

    const remainingSlots = this.maxTotalFiles - this.questionSelectedFiles.length;
    for (let i = 0; i < input.files.length && i < remainingSlots; i++) {
      const file = input.files[i];
      if (file.size > maxSizeInBytes) continue;
      const isDuplicate = this.questionSelectedFiles.some(
        f => f.name === file.name && f.size === file.size
      );
      if (!isDuplicate) {
        this.questionSelectedFiles.push(file);
      }
    }
    input.value = '';
  }

  private async uploadFiles(files: File[]): Promise<{ fileName: string; fileKey: string }[]> {
    const processedAttachments: { fileName: string; fileKey: string }[] = [];
    if (files.length === 0) return processedAttachments;

    for (const file of files) {
      try {
        const params = {
          fileName: file.name,
          contentType: file.type,
          purpose: QUESTIONNAIRE_CONVERSATION_ATTACHMENT,
        };
        const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
        if (imageInfo) {
          const res: any = await this.apiHelperService.getImageEtag(imageInfo.presignedUrl, file);
          if (res?.headers?.get(ETAG)) {
            processedAttachments.push({ fileName: file.name, fileKey: imageInfo.fileKey });
          }
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
      }
    }
    return processedAttachments;
  }

  private getPlainTextFromHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}
