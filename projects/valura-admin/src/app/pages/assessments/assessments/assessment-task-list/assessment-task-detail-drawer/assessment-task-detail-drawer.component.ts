import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { LoadingButtonComponent } from "@valura-lib/components//loading-button/loading-button.component";
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelect, MatOption } from "@angular/material/select";
import { MatDialog } from '@angular/material/dialog';
import { v1 as uuidv1 } from 'uuid';
import { RiskViewDrawerService } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS, ASSESSMENT_TASK_CONVERSATION_ATTACHMENT, QUESTIONNAIRE_CONVERSATION_ATTACHMENT } from '@admin-core/constants/constants';
import { ETAG } from '@admin-core/constants/api-constants';
import { PostMessageCommand, DeleteMessageCommand, UpdateMessageCommand, ConversationCommandType } from '@admin-core/models/assessment/conversation.model';
import { AuthService } from '@admin-core/services/auth.service';
import { TaskManagementService } from '@admin-core/services/task-management/task-management.service';
import { SafeHtmlPipe } from '@valura-lib/components//safe-html.pipe';
import { QuestionConversationPanelComponent } from '@valura-lib/components//question-conversation-panel/question-conversation-panel.component';
import { ACTIONS_REQUIRING_REASON, AssessmentAttachedTo, TaskDisplayStatusAction, TaskStatusActionApiMap } from '../../constants';
import { TaskActionReasonDialogComponent, TaskActionReasonDialogData, TaskActionReasonDialogResult } from '@valura-lib/components//task-action-reason-dialog/task-action-reason-dialog.component';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

interface Attachment {
  id: number;
  name: string;
  size: string;
  fileKey?: string;
}

interface MessageAttachment {
  id: number;
  name: string;
  fileKey?: string;
  size?: string;
}

interface ConversationMessage {
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
  selector: 'app-assessment-task-detail-drawer',
  imports: [MatIconModule, LoadingButtonComponent, EllipsisTooltipDirective, MatTooltipModule, CommonModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatSelect, MatOption, SafeHtmlPipe, QuestionConversationPanelComponent],
  templateUrl: './assessment-task-detail-drawer.component.html',
  styleUrl: './assessment-task-detail-drawer.component.scss'
})
export class AssessmentTaskDetailDrawerComponent implements OnDestroy, OnChanges {
  @Input() taskDetails: any;
  @Input() attachedToDetail: any;
  @Input() isLoading = false;
  @Input() assessmentId: number = 0;
  @Input() sections: any[] = [];
  @Input() assessmentTaskMaster: boolean = false;
  @Input() assessmentStatus: string = '';
  @Input() highlightMessageId: number | null = null;
  @Output() onCloseDrawer = new EventEmitter<any>();
  @Output() onTaskDeleted = new EventEmitter<any>();
  @Output() onActionChanged = new EventEmitter<any>();

  @ViewChild('editorContainer') editorContainer!: ElementRef;
  @ViewChild('questionEditorContainer') questionEditorContainer!: ElementRef;

  editor: Editor | undefined;
  questionEditor: Editor | undefined;
  dropDownOpen = false;
  showFullQuestionDetails = false;
  questionMessages: ConversationMessage[] = [];
  taskMessages: ConversationMessage[] = [];
  isLoadingTaskMessages = false;
  showTaskChat = false;
  taskMessagePage = 1;
  hasMoreTaskMessages = false;
  isLoadingMoreTaskMessages = false;
  taskIsReplyMode = false;
  taskReplyingToMessage: ConversationMessage | null = null;
  taskReplyingToMessageText = '';
  taskHoveredMessageId: number | null = null;
  isLoadingQuestionMessages = false;
  showQuestionChat = false;
  questionMessagePage = 0;
  hasMoreQuestionMessages = false;
  isLoadingMoreQuestionMessages = false;
  showToolbar = false;
  isReplyMode = false;
  replyingToMessage: any = null;
  replyingToMessageText = '';
  isEditMode = false;
  editingMessageAttachments: Attachment[] = [];
  selectedFiles: File[] = [];
  isSendingMessage = false;
  showCommentEditor = false;
  questionShowToolbar = false;
  questionSelectedFiles: File[] = [];
  questionIsReplyMode = false;
  questionReplyingToMessage: any = null;
  questionReplyingToMessageText = '';
  questionIsSendingMessage = false;
  hoveredMessageId: number | null = null;
  editingMessageId: number | null = null;
  highlightedMessageId: number | null = null;
  private highlightMessageTimer: any = null;
  maxVisibleReplies = 1;
  collapsedTaskReplies = new Map<number, boolean>();
  maxTotalFiles = 10;
  selectedAction = '';
  submitting = false;
  actionsList = [
    { value: TaskDisplayStatusAction.CLOSE, label: 'Close Task' },
    { value: TaskDisplayStatusAction.HOLD, label: 'Put On Hold' },
    { value: TaskDisplayStatusAction.RESUME_TASK, label: 'Resume Task' },
    { value: TaskDisplayStatusAction.REOPEN, label: 'Reopen Task' }
  ];

  actionOptions = this.actionsList

  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackbarService);
  private apiHelperService = inject(ApiHelperService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private riskViewDrawerService = inject(RiskViewDrawerService);
  private authService = inject(AuthService);
  private taskManagementService = inject(TaskManagementService);
  private assessmentService = inject(AssessmentService);

  disableActionButton = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskDetails'] && this.taskDetails) {
      this.showCommentEditor = false;
      this.showFullQuestionDetails = false;
      this.showQuestionChat = false;
      this.showTaskChat = false;
      this.taskMessages = [];
      this.collapsedTaskReplies.clear();
      this.taskMessagePage = 1;
      this.hasMoreTaskMessages = false;
      this.taskIsReplyMode = false;
      this.taskReplyingToMessage = null;
      this.taskReplyingToMessageText = '';
      this.questionMessages = [];
      this.questionMessagePage = 0;
      this.hasMoreQuestionMessages = false;
      this.questionShowToolbar = false;
      this.questionSelectedFiles = [];
      this.questionIsReplyMode = false;
      this.questionReplyingToMessage = null;
      this.questionReplyingToMessageText = '';
      this.questionIsSendingMessage = false;
      this.setupActionOptions()
      if (this.editor) {
        this.editor.destroy();
        this.editor = undefined;
      }
      if (this.questionEditor) {
        this.questionEditor.destroy();
        this.questionEditor = undefined;
      }

      if (this.taskDetails?.taskId) {
        this.loadTaskMessages().then(() => {
          if (this.highlightMessageId && this.taskMessages.length > 0) {
            this.showTaskChat = true;
            this.highlightMessage(this.highlightMessageId);
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.questionEditor?.destroy();
    if (this.highlightMessageTimer) clearTimeout(this.highlightMessageTimer);
  }

  private highlightMessage(messageId: number): void {
    this.highlightedMessageId = messageId;
    for (const msg of this.taskMessages) {
      if (msg.replies?.some(r => r.id === messageId)) {
        this.collapsedTaskReplies.set(msg.id, false);
        break;
      }
    }
    if (this.highlightMessageTimer) clearTimeout(this.highlightMessageTimer);
    this.highlightMessageTimer = setTimeout(() => {
      this.highlightedMessageId = null;
      this.cdr.detectChanges();
    }, 3000);

    setTimeout(() => {
      const el = document.querySelector(`[data-message-id="${messageId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }

  private createEditor(element: HTMLElement): Editor {
    const editor = new Editor({
      element,
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
    });

    setTimeout(() => editor?.commands.focus(), 100);
    return editor;
  }

  initEditor(): void {
    if (!this.editorContainer) return;
    this.editor = this.createEditor(this.editorContainer.nativeElement);
  }

  initQuestionEditor(retries = 3): void {
    if (!this.questionEditorContainer) {
      if (retries > 0) {
        this.cdr.detectChanges();
        setTimeout(() => this.initQuestionEditor(retries - 1), 50);
      }
      return;
    }
    this.questionEditor = this.createEditor(this.questionEditorContainer.nativeElement);
  }

  closeDrawer() {
    this.onCloseDrawer.emit(true);
  }

  async onEditTask(): Promise<void> {
    if (!this.taskDetails) return;
    try {
      const detail = this.taskDetails;
      const taskData = {
        taskId: detail.taskId,
        title: detail.title,
        priority: detail.priority,
        dueDate: detail.dueDate,
        description: detail.description || '',
        levelOfEffort: detail.levelOfEffort || null,
        status: detail.state || detail.status || 'OPEN',
        assignToUserType: detail.assignee?.userType || detail.assignToUserType || 'INTERNAL_USER',
        assignToUserId: detail.assignee?.userId || detail.assignToUserId || null,
        assigneeToUserName: detail.assignee?.userName || detail.assignToUserName || '',
        taskLabelMappings: detail.taskLabelMappings || detail.labelMappings || [],
        documentAttached: detail.taskDetails?.documentsAttached || detail.documentAttached || [],
        parentTaskId: detail.parentTaskId || 0,
        attachedTo: detail.attachedTo,
        attachedToId: detail.attachedToId,
        sectionId: detail.attachedToDetail?.questionDetail?.sectionId ?? this.attachedToDetail?.questionDetail?.sectionId ?? 0,
        sectionTitle: detail.attachedToDetail?.questionDetail?.sectionTitle ?? this.attachedToDetail?.questionDetail?.sectionTitle ?? '',
        questionTitle: detail.attachedToDetail?.questionDetail?.questionTitle ?? this.attachedToDetail?.questionDetail?.questionTitle ?? '',
      };
      const questionId = detail.attachedTo === AssessmentAttachedTo.ASSESSMENT_QUESTION || detail.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_QUESTION ? detail.attachedToId : 0;
      const createTaskPayload = {
        riskData: null,
        assessmentId: this.assessmentId,
        sections: this.sections,
        isEditMode: true,
        taskData,
        questionId,
        source: 'ASSESSMENT_TASK_EDIT',
        hideParameterFields: detail.attachedTo === AssessmentAttachedTo.ASSESSMENT || detail.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR || detail.attachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || detail.attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK,
        reopenDetailOnSave: true,
      };
      this.onCloseDrawer.emit(true);
      setTimeout(() => this.riskViewDrawerService.triggerCreateTask(createTaskPayload), 420);
    } catch (error) {
      this.snackbarService.openSnack('Failed to load task details', 'error');
    }
  }

  onDeleteTask(): void {
    if (!this.taskDetails) return;
    const detail = this.taskDetails;
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Task Deletion',
        content: 'Are you sure you want to delete this task?',
        confirmationDetail: detail.title || `Task ${detail.taskId}`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600',
      } as PopupDialogData,
    });
    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        const payload = {
          commandId: uuidv1(),
          commands: [{ type: 'deleteTask', taskId: detail.taskId }]
        };
        const attachedTo = detail.attachedTo;
        if (attachedTo === AssessmentAttachedTo.ASSESSMENT || attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR) {
          await this.assessmentApiHelperService.updateAssessmentMainTaskCommands(
            this.assessmentId,
            detail.taskId,
            payload
          );
        } else if (attachedTo === AssessmentAttachedTo.ASSESSMENT_RISK || attachedTo === AssessmentAttachedTo.ASSESSMENT_VENDOR_RISK) {
          await this.assessmentApiHelperService.updateAssessmentRiskTaskCommands(
            this.assessmentId,
            detail.attachedToId,
            detail.taskId,
            payload
          );
        } else {
          await this.assessmentApiHelperService.updateAssessmentTask(
            this.assessmentId,
            detail.attachedToId,
            detail.taskId,
            payload
          );
        }
        this.snackbarService.openSnack('Task deleted successfully', 'success');
        this.onCloseDrawer.emit(true);
        this.onTaskDeleted.emit(detail.taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
        this.snackbarService.openSnack('Failed to delete task', 'error');
      }
    });
  }

  onActionChange(event: any) {
    this.disableActionButton = true;
    const action = this.selectedAction;
    if (!action) {
      this.disableActionButton = false;
      return;
    }

    if (ACTIONS_REQUIRING_REASON.includes(action)) {
      this.openReasonDialog(action);
    } else {
      this.performTaskAction(action);
    }
  }

  private openReasonDialog(action: string): void {
    const actionLabel = action.toLowerCase().replace(/_/g, ' ');
    const dialogRef = this.dialog.open(TaskActionReasonDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        title: `Reason for ${actionLabel}`,
        action: action,
        reasonRequired: true,
        confirmText: 'Submit',
        cancelText: 'Cancel'
      } as TaskActionReasonDialogData
    });

    dialogRef.afterClosed().subscribe((result: TaskActionReasonDialogResult) => {
      if (result?.confirmed) {
        this.performTaskAction(action, result.reason);
      } else {
        this.disableActionButton = false;
        this.selectedAction = '';
      }
    });
  }

  private async performTaskAction(action: string, reason?: string): Promise<void> {
    const taskId = this.taskDetails?.taskId;
    if (!taskId) return;

    this.submitting = true;
    try {
      const apiAction = TaskStatusActionApiMap[action] || action;
      const command: any = {
        type: 'performTaskAction',
        action: apiAction
      };
      if (reason) {
        command.reason = reason;
      }
      const payload = {
        commandId: uuidv1(),
        commands: [command]
      };
      await this.assessmentApiHelperService.updateAssessmentMainTaskCommands(
        this.assessmentId,
        taskId,
        payload
      );
      const detail = await this.assessmentApiHelperService.getAssessmentTaskDetail(this.assessmentId, taskId);
      if (detail && this.taskDetails) {
        this.taskDetails.state = detail.state ?? this.taskDetails.state;
        this.taskDetails.status = detail.status ?? this.taskDetails.status;
        this.taskDetails.completed = detail.completed ?? this.taskDetails.completed;
      }
      this.setupActionOptions();
      this.onActionChanged.emit(true);
    } catch (e) {
      console.error('Error updating task status:', e);
    } finally {
      this.submitting = false;
      this.disableActionButton = false;
      this.selectedAction = '';
    }
  }

  openCommentEditor() {
    this.showCommentEditor = true;
    this.cdr.detectChanges();
    setTimeout(() => this.initEditor(), 0);
  }

  toggleDropdown() {
    this.dropDownOpen = !this.dropDownOpen;
    this.showFullQuestionDetails = false
    if (this.dropDownOpen && this.showFullQuestionDetails) {
      this.cdr.detectChanges();
      setTimeout(() => this.initQuestionEditor(), 0);
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleDateString('en-GB');
  }

  toggleToolbar(): void {
    this.showToolbar = !this.showToolbar;
    if (this.showToolbar) {
      setTimeout(() => this.editor?.commands.focus(), 100);
    }
  }

  toggleFormat(format: string, editor?: Editor): void {
    const target = editor || this.editor;
    if (!target || (target as any).isDestroyed) return;
    switch (format) {
      case 'bold': target.chain().focus().toggleBold().run(); break;
      case 'italic': target.chain().focus().toggleItalic().run(); break;
      case 'underline': target.chain().focus().toggleUnderline().run(); break;
      case 'bulletList': target.chain().focus().toggleBulletList().run(); break;
      case 'orderedList': target.chain().focus().toggleOrderedList().run(); break;
    }
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

  onMessagesScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (atBottom && this.hasMoreQuestionMessages && !this.isLoadingMoreQuestionMessages) {
      this.loadMoreQuestionMessages();
    }
  }

  // Reply methods
  cancelReply(): void {
    this.isReplyMode = false;
    this.replyingToMessage = null;
    this.replyingToMessageText = '';
  }

  // Edit methods
  cancelEdit(): void {
    this.showToolbar = false;
    this.isEditMode = false;
    this.editingMessageId = null;
    this.editingMessageAttachments = [];
    this.selectedFiles = [];
    if (this.editor) {
      this.editor.commands.setContent('');
    }
    if (this.questionEditor) {
      this.questionEditor.commands.setContent('');
    }
  }

  removeEditingAttachment(index: number): void {
    this.editingMessageAttachments.splice(index, 1);
  }

  // File methods
  triggerFileInput(targetFiles: File[]): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = (event: any) => this.handleFileSelection(event, targetFiles);
    fileInput.click();
  }

  attachFiles(): void {
    this.triggerFileInput(this.selectedFiles);
  }

  attachQuestionFiles(): void {
    this.triggerFileInput(this.questionSelectedFiles);
  }

  private handleFileSelection(event: Event, targetFiles: File[]): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const maxSizeInBytes = 5 * 1024 * 1024;
    const totalExistingFiles = targetFiles.length + (targetFiles === this.selectedFiles ? this.editingMessageAttachments.length : 0);

    if (totalExistingFiles >= this.maxTotalFiles) {
      input.value = '';
      return;
    }

    const remainingSlots = this.maxTotalFiles - totalExistingFiles;

    for (let i = 0; i < input.files.length && i < remainingSlots; i++) {
      const file = input.files[i];
      if (file.size > maxSizeInBytes) continue;

      const isDuplicate = targetFiles.some(
        f => f.name === file.name && f.size === file.size
      );
      if (!isDuplicate) {
        targetFiles.push(file);
      }
    }

    input.value = '';
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  removeQuestionSelectedFile(index: number): void {
    this.questionSelectedFiles.splice(index, 1);
  }

  // Send message
  async sendMessage(): Promise<void> {
    if (!this.editor || this.isSendingMessage) return;

    const content = this.editor.getHTML();
    const textContent = this.getPlainTextFromHtml(content).trim();

    if (!textContent && this.selectedFiles.length === 0) return;

    const taskId = this.taskDetails?.taskId;
    if (!taskId) return;

    this.isSendingMessage = true;
    try {
      if (this.isEditMode && this.editingMessageId) {
        const updateSubCommands: UpdateMessageCommand['commands'] = [];
        updateSubCommands.push({ type: 'updateMessageContent', message: content });

        const processedAttachments = await this.uploadFiles(this.selectedFiles, ASSESSMENT_TASK_CONVERSATION_ATTACHMENT);
        if (processedAttachments.length > 0) {
          updateSubCommands.push({ type: 'addMessageAttachments', attachments: processedAttachments });
        }
        const originalMessage = this.findTaskMessageById(this.editingMessageId);
        const originalAttachmentIds = (originalMessage?.attachments || []).map(a => a.id);
        const remainingAttachmentIds = this.editingMessageAttachments.map(a => a.id);
        const deletedAttachmentIds = originalAttachmentIds.filter(id => !remainingAttachmentIds.includes(id));
        if (deletedAttachmentIds.length > 0) {
          updateSubCommands.push({ type: 'deleteMessageAttachments', attachmentMappingIds: deletedAttachmentIds });
        }
        const command: UpdateMessageCommand = {
          type: 'updateMessage',
          commands: updateSubCommands
        };
        await this.assessmentApiHelperService.updateTaskConversation(
          this.assessmentId,
          taskId,
          this.editingMessageId,
          [command]
        );
      } else {
        const processedAttachments = await this.uploadFiles(this.selectedFiles, ASSESSMENT_TASK_CONVERSATION_ATTACHMENT);
        const command: PostMessageCommand = {
          type: 'postMessage',
          message: content,
          messageParentId: this.isReplyMode && this.replyingToMessage
            ? (this.replyingToMessage.parentId || this.replyingToMessage.id)
            : 0,
          attachments: processedAttachments
        };
        await this.assessmentApiHelperService.createTaskConversation(
          this.assessmentId,
          taskId,
          [command]
        );
      }
      this.editor.commands.setContent('');
      this.selectedFiles = [];
      this.editingMessageAttachments = [];
      this.isEditMode = false;
      this.editingMessageId = null;
      this.isReplyMode = false;
      this.replyingToMessage = null;
      await this.loadTaskMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      this.snackbarService.openSnack(this.isEditMode ? 'Failed to update message' : 'Failed to send message', 'error');
    } finally {
      this.isSendingMessage = false;
    }
  }

  // Question detail methods
  async viewFullQuestionDetails(): Promise<void> {
    this.showFullQuestionDetails = true;
    this.cdr.detectChanges();
    setTimeout(() => this.initQuestionEditor(), 0);
  }

  toggleQuestionChat(): void {
    this.showQuestionChat = !this.showQuestionChat;
    if (this.showQuestionChat && this.questionMessages.length === 0) {
      this.loadQuestionMessages();
    }
  }

  private async loadQuestionMessages(): Promise<void> {
    const questionId = this.taskDetails?.attachedToId;
    const sectionId = this.attachedToDetail?.questionDetail?.sectionId;
    if (!questionId || !sectionId) return;

    this.questionMessagePage = 0;
    this.isLoadingQuestionMessages = true;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId,
          questionId,
          messagePage: 0,
          messageLimit: 10
        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === sectionId);
      const q = sec?.question?.find((q: any) => q.questionId === questionId);
      if (q) {
        const messages = (q.messages || []).map((m: any) => this.mapApiMessage(m));
        for (const message of messages) {
          if (message.childConversationsCount && message.childConversationsCount > 0) {
            try {
              const childRes = await this.assessmentApiHelperService.getAssessmentSectionDetail(
                this.assessmentId,
                {
                  sectionId,
                  questionId,
                  messagePage: 0,
                  messageLimit: 50,
                  conversationId: message.id,
                  depthOfChildMessageCount: message.childConversationsCount
                }
              );
              const childSec = childRes?.sectionResponses?.find((s: any) => s.sectionId === sectionId);
              const childQ = childSec?.question?.find((cq: any) => cq.questionId === questionId);
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

  async loadMoreQuestionMessages(): Promise<void> {
    if (this.isLoadingMoreQuestionMessages || !this.hasMoreQuestionMessages) return;

    const questionId = this.taskDetails?.attachedToId;
    const sectionId = this.attachedToDetail?.questionDetail?.sectionId;
    if (!questionId || !sectionId) return;

    this.isLoadingMoreQuestionMessages = true;
    this.questionMessagePage++;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId,
          questionId,
          messagePage: this.questionMessagePage,
          messageLimit: 10
        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === sectionId);
      const q = sec?.question?.find((q: any) => q.questionId === questionId);
      if (q) {
        const newMessages = (q.messages || []).map((m: any) => this.mapApiMessage(m));
        for (const message of newMessages) {
          if (message.childConversationsCount && message.childConversationsCount > 0) {
            try {
              const childRes = await this.assessmentApiHelperService.getAssessmentSectionDetail(
                this.assessmentId,
                {
                  sectionId,
                  questionId,
                  messagePage: 0,
                  messageLimit: 50,
                  conversationId: message.id,
                  depthOfChildMessageCount: message.childConversationsCount
                }
              );
              const childSec = childRes?.sectionResponses?.find((s: any) => s.sectionId === sectionId);
              const childQ = childSec?.question?.find((cq: any) => cq.questionId === questionId);
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

  async onQuestionRemarkDone(): Promise<void> {
    if (!this.questionEditor) return;
    const content = this.questionEditor.getHTML();
    const textContent = this.getPlainTextFromHtml(content).trim();

    const taskId = this.taskDetails?.taskId;
    if (!taskId || !textContent) {
      this.showFullQuestionDetails = false;
      this.showQuestionChat = false;
      if (this.questionEditor) {
        this.questionEditor.destroy();
        this.questionEditor = undefined;
      }
      return;
    }

    try {
      const command: PostMessageCommand = {
        type: 'postMessage',
        message: content,
        messageParentId: 0,
        attachments: []
      };
      await this.assessmentApiHelperService.createTaskConversation(
        this.assessmentId,
        taskId,
        [command]
      );
      this.snackbarService.openSnack('Remark added successfully', 'success');
    } catch (error) {
      console.error('Error saving remark:', error);
      this.snackbarService.openSnack('Failed to add remark', 'error');
    } finally {
      this.showFullQuestionDetails = false;
      this.showQuestionChat = false;
      if (this.questionEditor) {
        this.questionEditor.destroy();
        this.questionEditor = undefined;
      }
    }
  }

  async sendQuestionMessage(): Promise<void> {
    if (!this.questionEditor || this.questionIsSendingMessage) return;

    const content = this.questionEditor.getHTML();
    const textContent = this.getPlainTextFromHtml(content).trim();

    if (!textContent && this.questionSelectedFiles.length === 0) return;

    const questionId = this.taskDetails?.attachedToId;
    if (!questionId) return;

    this.questionIsSendingMessage = true;
    try {
      const processedAttachments = await this.uploadFiles(this.questionSelectedFiles, QUESTIONNAIRE_CONVERSATION_ATTACHMENT);

      const command: PostMessageCommand = {
        type: 'postMessage',
        message: content,
        messageParentId: this.questionIsReplyMode && this.questionReplyingToMessage
          ? (this.questionReplyingToMessage.parentId || this.questionReplyingToMessage.id)
          : 0,
        attachments: processedAttachments
      };
      await this.assessmentApiHelperService.createQuestionConversation(
        this.assessmentId,
        questionId,
        [command]
      );
      this.questionEditor.commands.setContent('');
      this.questionSelectedFiles = [];
      this.questionIsReplyMode = false;
      this.questionReplyingToMessage = null;
      this.questionReplyingToMessageText = '';
      this.snackbarService.openSnack('Message sent successfully', 'success');
      await this.loadQuestionMessages();
    } catch (error) {
      console.error('Error sending question message:', error);
      this.snackbarService.openSnack('Failed to send message', 'error');
    } finally {
      this.questionIsSendingMessage = false;
      this.cdr.detectChanges();
    }
  }

  toggleQuestionToolbar(): void {
    this.questionShowToolbar = !this.questionShowToolbar;
    if (this.questionShowToolbar) {
      setTimeout(() => this.questionEditor?.commands.focus(), 100);
    }
  }

  toggleQuestionFormat(format: string): void {
    this.toggleFormat(format, this.questionEditor);
  }

  cancelQuestionReply(): void {
    this.questionIsReplyMode = false;
    this.questionReplyingToMessage = null;
    this.questionReplyingToMessageText = '';
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

  async deleteQuestionMessage(messageId: number): Promise<void> {
    const questionId = this.taskDetails?.attachedToId;
    if (!questionId) return;

    try {
      const command: DeleteMessageCommand = {
        type: ConversationCommandType.DELETE_MESSAGE as 'deleteMessage',
        messageId
      };
      await this.assessmentApiHelperService.updateQuestionConversation(
        this.assessmentId, questionId, messageId, [command]
      );
      await this.loadQuestionMessages();
    } catch (e) {
      console.error('Error deleting message:', e);
      this.snackbarService.openSnack('Failed to delete message', 'error');
    }
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

  isQuestionEditorActive(format: string): boolean {
    if (!this.questionEditor || (this.questionEditor as any).isDestroyed) return false;
    try {
      return this.questionEditor.isActive(format);
    } catch {
      return false;
    }
  }

  private async uploadFiles(files: File[], purpose: string): Promise<{ fileName: string; fileKey: string }[]> {
    const processedAttachments: { fileName: string; fileKey: string }[] = [];
    if (files.length === 0) return processedAttachments;

    for (const file of files) {
      try {
        const params = {
          fileName: file.name,
          contentType: file.type,
          purpose,
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

  private getPlainTextFromHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }


  toggleTaskChat(): void {
    this.showTaskChat = !this.showTaskChat;
    if (this.showTaskChat && this.taskMessages.length === 0) {
      this.loadTaskMessages();
    }
  }

  async loadTaskMessages(): Promise<void> {
    const taskId = this.taskDetails?.taskId;
    if (!taskId) return;

    this.taskMessagePage = 1;
    this.isLoadingTaskMessages = true;
    try {
      const res = await this.apiHelperService.getAssessmentTaskConversation(this.assessmentId, taskId, this.taskMessagePage);
      if (res) {
        const messages = (res.messages || res || []).map((m: any) => this.mapTaskApiMessage(m));
        for (const message of messages) {
          if (message.childConversationsCount && message.childConversationsCount > 0) {
            try {
              const childRes = await this.apiHelperService.getAssessmentTaskConversation(
                this.assessmentId, taskId, 1, message.id, message.childConversationsCount
              );
              if (childRes?.messages) {
                const childMessages = (childRes.messages || []).map((m: any) => this.mapTaskApiMessage(m));
                message.replies = childMessages.filter((m: ConversationMessage) => m.parentId === message.id);
              }
            } catch (error) {
              console.error(`Error loading children for message ${message.id}:`, error);
            }
          }
        }

        this.taskMessages = this.buildMessageTree(messages);
        this.hasMoreTaskMessages = messages.length === 10;
      }
    } catch (e) {
      console.error('Error loading task messages:', e);
    } finally {
      this.isLoadingTaskMessages = false;
      this.cdr.detectChanges();
    }
  }

  async loadMoreTaskMessages(): Promise<void> {
    if (this.isLoadingMoreTaskMessages || !this.hasMoreTaskMessages) return;

    const taskId = this.taskDetails?.taskId;
    if (!taskId) return;

    this.isLoadingMoreTaskMessages = true;
    this.taskMessagePage++;
    try {
      const res = await this.apiHelperService.getAssessmentTaskConversation(this.assessmentId, taskId, this.taskMessagePage);
      if (res) {
        const newMessages = (res.messages || res || []).map((m: any) => this.mapTaskApiMessage(m));
        for (const message of newMessages) {
          if (message.childConversationsCount && message.childConversationsCount > 0) {
            try {
              const childRes = await this.apiHelperService.getAssessmentTaskConversation(
                this.assessmentId, taskId, 1, message.id, message.childConversationsCount
              );
              if (childRes?.messages) {
                const childMessages = (childRes.messages || []).map((m: any) => this.mapTaskApiMessage(m));
                message.replies = childMessages.filter((m: ConversationMessage) => m.parentId === message.id);
              }
            } catch (error) {
              console.error(`Error loading children for message ${message.id}:`, error);
            }
          }
        }

        this.hasMoreTaskMessages = newMessages.length === 10;
        const existingFlat = this.flattenMessages(this.taskMessages);
        this.taskMessages = this.buildMessageTree([...existingFlat, ...newMessages]);
      } else {
        this.hasMoreTaskMessages = false;
      }
    } catch (e) {
      console.error('Error loading more task messages:', e);
      this.taskMessagePage--;
    } finally {
      this.isLoadingMoreTaskMessages = false;
      this.cdr.detectChanges();
    }
  }

  onTaskMessagesScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (atBottom && this.hasMoreTaskMessages && !this.isLoadingMoreTaskMessages) {
      this.loadMoreTaskMessages();
    }
  }


  private mapTaskApiMessage(m: any): ConversationMessage {
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

  startTaskReply(message: ConversationMessage): void {
    this.isReplyMode = true;
    this.replyingToMessage = message;
    const plainText = message.text.replace(/<[^>]*>/g, '');
    this.replyingToMessageText = plainText.length > 100
      ? plainText.substring(0, 100) + '...'
      : plainText;
    if (!this.showCommentEditor) {
      this.openCommentEditor();
    }
  }

  async deleteTaskMessage(messageId: number): Promise<void> {
    const taskId = this.taskDetails?.taskId;
    if (!taskId) return;

    try {
      const command: DeleteMessageCommand = {
        type: ConversationCommandType.DELETE_MESSAGE as 'deleteMessage',
        messageId
      };
      await this.assessmentApiHelperService.updateTaskConversation(
        this.assessmentId, taskId, messageId, [command]
      );
      await this.loadTaskMessages();
    } catch (e) {
      console.error('Error deleting task message:', e);
      this.snackbarService.openSnack('Failed to delete message', 'error');
    }
  }

  startTaskEdit(messageId: number): void {
    const message = this.findTaskMessageById(messageId);
    if (!message) return;

    if (!this.showCommentEditor) {
      this.openCommentEditor();
    }
    this.isEditMode = true;
    this.editingMessageId = messageId;
    this.isReplyMode = false;
    this.replyingToMessage = null;
    this.replyingToMessageText = '';
    this.editingMessageAttachments = (message.attachments || []).map(a => ({
      id: a.id,
      name: a.name,
      size: a.size || '',
      fileKey: a.fileKey
    }));
    this.selectedFiles = [];
    setTimeout(() => {
      this.editor?.commands.setContent(message.text);
      this.editor?.commands.focus();
    }, 150);
  }

  private findTaskMessageById(id: number): ConversationMessage | undefined {
    for (const msg of this.taskMessages) {
      if (msg.id === id) return msg;
      if (msg.replies) {
        const reply = msg.replies.find(r => r.id === id);
        if (reply) return reply;
      }
    }
    return undefined;
  }

  setupActionOptions() {
    if (this.isAssigned) {
      if (this.taskOpen || this.requestTaskInProgress || this.requestTaskReopened) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.SUBMIT_FOR_REVIEW, label: 'Send' }
        ];
      }
      else {
        this.actionOptions = []
      }
    }
    else if (!this.isAssigned) {
      if (this.taskOpen || this.requestTaskInProgress || this.requestTaskReopened) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.CLOSE, label: 'Close task' },
          { value: TaskDisplayStatusAction.HOLD, label: 'On hold' },
        ];
      }
      else if (this.requestTaskSendForReview) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.CLOSE, label: 'Close task' },
          { value: TaskDisplayStatusAction.HOLD, label: 'On hold' },
        ];
      }
      else if (this.requestTaskClosed) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.REOPEN, label: 'Re-open Task' }
        ]
      }
      else if (this.requestTaskOnHold) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.RESUME_TASK, label: 'Resume task' },
          { value: TaskDisplayStatusAction.CLOSE, label: 'Close task' }
        ]
      }
      else {
        this.actionOptions = []
      }
    }

  }

  get isAssigned(): boolean {
    return this.taskDetails?.isAssigned ?? false;
  }

  get showActionButton() {
    return !(this.taskCompleted) || this.actionOptions.length > 0;
  }

  get taskOpen(): boolean {
    return (this.taskManagementService.requestTaskOpen((this.taskDetails?.state ?? '')))
  }

  get requestTaskInProgress(): boolean {
    return (this.taskManagementService.requestTaskInProgress((this.taskDetails?.state ?? '')))
  }

  get requestTaskOnHold(): boolean {
    return (this.taskManagementService.requestTaskOnHold((this.taskDetails?.state ?? '')))
  }

  get requestTaskClosed(): boolean {
    return (this.taskManagementService.requestTaskClosed((this.taskDetails?.state ?? '')))
  }

  get requestTaskReopened(): boolean {
    return (this.taskManagementService.requestTaskReopened((this.taskDetails?.state ?? '')))
  }

  get requestTaskSendForReview(): boolean {
    return (this.taskManagementService.requestTaskSendForReview((this.taskDetails?.state ?? '')))
  }

  get taskCompleted(): boolean {
    return (this.taskDetails?.completed ?? false)
  }

  getVisibleTaskReplies(message: ConversationMessage): ConversationMessage[] {
    if (!message.replies) return [];
    const isCollapsed = this.collapsedTaskReplies.get(message.id) !== false;
    if (isCollapsed && message.replies.length > this.maxVisibleReplies) {
      return message.replies.slice(message.replies.length - this.maxVisibleReplies);
    }
    return message.replies;
  }

  getHiddenTaskRepliesCount(message: ConversationMessage): number {
    if (!message.replies) return 0;
    return message.replies.length - this.maxVisibleReplies;
  }

  shouldShowTaskExpandButton(message: ConversationMessage): boolean {
    if (!message.replies) return false;
    const isCollapsed = this.collapsedTaskReplies.get(message.id) !== false;
    return isCollapsed && message.replies.length > this.maxVisibleReplies;
  }

  toggleTaskRepliesExpansion(messageId: number): void {
    this.collapsedTaskReplies.set(messageId, false);
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  get isAssessmentReadOnly(): boolean {
    // return this.assessmentStatus === AssessmentStatus.COMPLETED || this.assessmentStatus === AssessmentStatus.CANCELLED || this.assessmentStatus === AssessmentStatus.APPROVED;
    return this.assessmentService.assessmentCompleted(this.assessmentStatus) || this.assessmentService.assessmentCancelled(this.assessmentStatus)
  }

  get _showActionButton() {
    if (this.isInternalOrExternalUser || this.assessmentTaskMaster || this.isAssessmentReadOnly) return false;
    return true;
  }
}
