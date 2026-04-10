import { Component, inject, Input, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WidgetType } from '../../../../../../../valura-lib/src/lib/constants/widget-types';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SafeHtmlPipe } from '@valura-lib/components//safe-html.pipe';
import { PostMessageCommand, DeleteMessageCommand, UpdateMessageCommand, ConversationCommandType } from '@admin-core/models/assessment/conversation.model';
import { QUESTIONNAIRE_CONVERSATION_ATTACHMENT } from '@admin-core/constants/constants';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE, ETAG } from '@admin-core/constants/api-constants';
import { MatDialog } from '@angular/material/dialog';
import { RiskDrawerService } from '@admin-core/services/risk-drawer/risk-drawer.service';
import { RiskViewDrawerService } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { AuthService } from '@admin-core/services/auth.service';
import { DiscussionLogNavigationTarget } from '../assessment-discussion-log/assessment-discussion-log.component';
import { buildApproveQuestionResponseCommand } from '../assessment-utils';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { assessmentApproverAnswerMessage } from '@admin-core/utils/error-message/assessment-error-message-util';
import { AssessemntSource, AssessmentQuestionStatus } from '../constants';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';


export interface MessageAttachment {
  id: number;
  name: string;
  fileKey?: string;
  size?: string;
}

interface UploadedFileData {
  file: File;
  presignedUrl: string;
  fileKey: string;
  originalFileName: string;
}

export interface ConversationMessage {
  id: number;
  sender: string;
  senderType: 'ADMIN_USER' | 'EXTERNAL_USER';
  senderUserId?: number;
  messageType: 'Remark' | 'Response';
  timestamp: string;
  text: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  canUpdateMessage?: boolean;
  childMessagesCount?: number;
  attachments?: MessageAttachment[];
  replies?: ConversationMessage[];
  parentId?: number | null;
  isEditing?: boolean;
  editText?: string;
}

export interface Question {
  id: number;
  text: string;
  type: string;
  options?: { value: string; label?: string }[];
  helperText: string;
  answer: string;
  commentValue?: string;
  status?: string;
  isExpanded: boolean;
  isEditMode: boolean;
  displayOrder: number;
  editingMessage: ConversationMessage | null;
  showChat: boolean;
  showToolbar: boolean;
  newMessage: string;
  hoveredMessageId: number | null;
  showSendDropdown?: boolean;

  selectedFiles: File[];
  showWarning: boolean;
  warningMessage: string;
  warningTimer?: any;
  associatedFiles?: any[];
  messages: ConversationMessage[];
  collapsedReplies: Map<number, boolean>;
  isReplyMode: boolean;
  replyingToMessage: ConversationMessage | null;
  replyingToMessageText: string;
  messagePage: number;
  hasMoreMessages: boolean;
  editor?: any;
  isLoadingMoreMessages: boolean;
  approveLoading: boolean;
  editingAttachments?: MessageAttachment[];
}

export interface Section {
  id: number;
  title: string;
  description: string;
  answeredCount: number;
  totalCount: number;
  displayOrder: number;
  completionPercentage: number;
  isExpanded: boolean;
  questions: Question[];
  questionPage: number;
  hasMoreQuestions: boolean;
  isLoadingQuestions: boolean;
}

@Component({
  selector: 'app-question-and-response',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, SafeHtmlPipe],
  templateUrl: './question-and-response.component.html',
  styleUrl: './question-and-response.component.scss'
})
export class QuestionAndResponseComponent implements OnInit, OnChanges {
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private apiHelperService = inject(ApiHelperService);
  private authService = inject(AuthService);
  public dialog = inject(MatDialog);
  private elementRef = inject(ElementRef);


  @Input() assessmentId!: number;
  @Input() templateId!: number;
  @Input() assessmentSections: any[] = [];
  @Input() risks: any[] = [];
  @Input() riskMatrix: string = 'M5';
  @Input() focusTarget: DiscussionLogNavigationTarget | null = null;
  @Input() assessmentSource: string = AssessemntSource.GENERAL
  @Input() status: string = '';
  @Input() isAuthor: boolean = false;

  isLoading = false;
  uploadedFilesData: UploadedFileData[] = [];
  fileUploadInProgress: boolean = false;
  isSendingMessage: boolean = false;
  isFocusedMode = false;
  highlightedMessageId: number | null = null;
  private highlightTimer: any = null;
  private isNavigatingToMessage = false;
  private lastApiLoadedId = 0;


  private riskDrawerService = inject(RiskDrawerService);
  private riskViewDrawerService = inject(RiskViewDrawerService);
  private snackbarService = inject(SnackbarService);
  private assessmentService = inject(AssessmentService);

  maxVisibleReplies = 1;
  readonly MAX_TOTAL_FILES = 10;
  readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  WidgetType = WidgetType;
  AssessmentQuestionStatus = AssessmentQuestionStatus
  sections: Section[] = [];
  sectionPage: number = 0;
  hasMoreSections: boolean = false;
  isLoadingMoreSections: boolean = false;

  async ngOnInit(): Promise<void> {
    if (this.assessmentId) {
      this.lastApiLoadedId = this.assessmentId;
      if (this.focusTarget) {
        await this.loadFocusedView(this.focusTarget);
      } else {
        await this.loadSections();
      }
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.sections.forEach(section =>
      section.questions.forEach(q => q.showSendDropdown = false)
    );
  }
  async loadSections(): Promise<void> {
    this.isLoading = true;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionPage: 0,
          sectionLimit: 10,
          questionLimit: 0
        }
      );
      if (res?.sectionResponses) {
        this.sections = this.mapApiResponseToSections(res.sectionResponses);
        this.hasMoreSections = res.sectionResponses.length === 10;
      }
    } catch (e) {
      console.error('Error loading sections:', e);
    } finally {
      this.isLoading = false;
    }
  }


  private parseJSON(data: any, fallback: any = ''): any {
    try {
      if (typeof data === 'string') data = JSON.parse(data);
      if (typeof data === 'string') data = JSON.parse(data);
      return data ?? fallback;
    } catch {
      return fallback;
    }
  }

  formatCheckboxAnswer(answer: string): string {
    const parsed = this.parseJSON(answer, []);
    return Array.isArray(parsed) ? parsed.join(', ') : '';
  }

  getFileAttachments(answer: string): any[] {
    const parsed = this.parseJSON(answer, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  getDisplayFileName(file: any): string {
    if (file?.fileName) return file.fileName;
    if (file?.fileKey) {
      const parts = file.fileKey.split('/');
      return parts[parts.length - 1];
    }
    return '';
  }



  private mapApiResponseToSections(sectionResponses: any[]): Section[] {
    return sectionResponses.map((sec: any) => {
      const questions = (sec.question || []).map((q: any) => this.mapApiQuestion(q));
      const answeredCount = sec.totalAnsweredQuestions ?? 0;
      return {
        id: sec.sectionId,
        title: sec.sectionTitle,
        description: sec.sectionDescription ?? '',
        totalCount: sec.totalQuestions,
        displayOrder: sec.displayOrder ?? 0,
        answeredCount,
        completionPercentage: sec.totalQuestions
          ? Math.round((answeredCount / sec.totalQuestions) * 100)
          : 0,
        isExpanded: false,
        questions,
        questionPage: 0,
        hasMoreQuestions: questions.length === 10,
        isLoadingQuestions: false
      } as Section;
    });
  }


  private mapApiQuestion(q: any): Question {

    let associatedFiles: any[] = [];
    try {
      associatedFiles = q.response?.associatedFiles
        ? JSON.parse(q.response.associatedFiles)
        : [];
    } catch { associatedFiles = []; }

    return {
      id: q.questionId,
      text: q.questionText,
      type: q.questionType,
      options: (q.options || []).map((o: any) => ({
        value: o.value,
        label: o.label
      })),
      helperText: q.helperText ?? '',
      answer: q.response?.response ?? '',
      commentValue: q.response?.commentDetail?.comment ?? '',
      status: q.questionStatus ?? AssessmentQuestionStatus.PENDING,
      isExpanded: false,
      isEditMode: false,
      displayOrder: q.displayOrder ?? 0,
      editingMessage: null,
      showChat: false,
      showToolbar: false,
      newMessage: '',
      hoveredMessageId: null,
      selectedFiles: [],
      showWarning: false,
      warningMessage: '',
      associatedFiles,
      messages: this.buildMessageTree((q.messages || []).map((m: any) => this.mapApiMessage(m))),
      collapsedReplies: new Map(),
      isReplyMode: false,
      replyingToMessage: null,
      replyingToMessageText: '',
      messagePage: 0,
      hasMoreMessages: (q.messages || []).length === 10,
      isLoadingMoreMessages: false,
      approveLoading: false
    };
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
      isEdited: m.isEdited ?? false,
      isDeleted: m.isDeleted ?? false,
      canUpdateMessage: true,
      childMessagesCount: m.childConversationsCount ?? 0,
      isEditing: false,
      editText: '',
      attachments: (m.attachments || []).map((a: any) => ({
        id: a.id,
        name: a.fileName,
        fileKey: a.fileKey,
        size: a.fileSize
      })),
      replies: [],
      parentId: (m.parentId === 0 || m.parentId === null || m.parentId === undefined) ? null : m.parentId
    };
  }





  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessmentId'] && !changes['assessmentId'].firstChange && this.assessmentId) {
      this.lastApiLoadedId = this.assessmentId;
      this.loadSections();
    }
    if (changes['assessmentSections'] && this.assessmentSections?.length) {
      if (this.lastApiLoadedId === this.assessmentId) return;
      this.sections = this.assessmentSections.map((apiSection: any) => {
        const questions: Question[] = (apiSection.questions || []).map((q: any) => {
          const lastResponse = q.responseDetails?.length
            ? q.responseDetails[q.responseDetails.length - 1]
            : null;
          const rawAnswer = lastResponse?.response ?? '';
          const answer = typeof rawAnswer === 'string'
            ? rawAnswer.replace(/<[^>]*>/g, '').trim()
            : rawAnswer ? String(rawAnswer) : '';

          return {
            id: q.id,
            text: q.text?.replace(/<[^>]*>/g, '').trim() ?? '',
            helperText: q.helperText ?? '',
            answer,
            type: q.questionType ?? q.type ?? '',
            isExpanded: false,
            displayOrder: q.displayOrder ?? 0,
            isEditMode: false,
            editingMessage: null,
            showChat: false,
            showToolbar: false,
            newMessage: '',
            hoveredMessageId: null,
            selectedFiles: [],
            showWarning: false,
            warningMessage: '',
            collapsedReplies: new Map(),
            isReplyMode: false,
            replyingToMessage: null,
            replyingToMessageText: '',
            messages: [],
            messagePage: 0,
            hasMoreMessages: false,
            isLoadingMoreMessages: false,
            approveLoading: false
          } as Question;

        });

        const answeredCount = questions.filter(q => q.answer.length > 0).length;
        const totalCount = apiSection.totalQuestion ?? questions.length;
        const completionPercentage = totalCount > 0
          ? Math.round((answeredCount / totalCount) * 100)
          : 0;

        return {
          id: apiSection.id,
          title: apiSection.sectionName ?? '',
          answeredCount,
          totalCount,
          completionPercentage,
          displayOrder: apiSection.displayOrder ?? 0,
          isExpanded: false,
          questions,
        } as Section;
      });
    }
    if (changes['focusTarget'] && !changes['focusTarget'].firstChange) {
      if (this.focusTarget) {
        this.loadFocusedView(this.focusTarget);
      } else {
        this.clearFocusedMode();
      }
    }
  }




  async toggleSection(section: Section): Promise<void> {
    section.isExpanded = !section.isExpanded;

    if (!section.isExpanded) {
      section.questions.forEach(q => this.destroyQuestionEditor(q));
    }

    if (section.isExpanded && section.questions.length === 0) {
      await this.loadQuestionsForSection(section);
    } else if (section.isExpanded) {
      setTimeout(() => {
        section.questions.forEach(q => {
          if (q.isExpanded) {
            const container = document.querySelector(
              `[data-question-id="${q.id}"] .tiptap-editor-container`
            ) as HTMLElement;
            if (container && !q.editor) {
              this.initQuestionEditor(q, container);
            }
          }
        });
      }, 100);
    }
  }

  toggleQuestion(question: Question): void {
    question.isExpanded = !question.isExpanded;
    if (question.isExpanded) {
      setTimeout(() => {
        const container = document.querySelector(
          `[data-question-id="${question.id}"] .tiptap-editor-container`
        ) as HTMLElement;
        if (container && !question.editor) {
          this.initQuestionEditor(question, container);
        }
      }, 100);
    } else {
      this.destroyQuestionEditor(question);
    }
  }

  toggleChat(question: Question): void {
    question.showChat = !question.showChat;
    if (question.showChat) {
      setTimeout(() => {
        const allAreas = document.querySelectorAll('.messages-area');
        allAreas.forEach(area => { area.scrollTop = area.scrollHeight; });
      }, 100);
    }
  }

  initQuestionEditor(question: Question, container: HTMLElement): void {
    if (question.editor) return;
    question.editor = new Editor({
      element: container,
      extensions: [
        StarterKit.configure({
          heading: false, code: false, codeBlock: false,
          blockquote: false, horizontalRule: false,
        }),
        Underline,
        Placeholder.configure({
          placeholder: 'Add your remark here.',
          showOnlyWhenEditable: true,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content: '',
      editorProps: { attributes: { class: 'tiptap-editor' } },
      onUpdate: ({ editor }) => {
        question.newMessage = editor.getHTML();
        this.checkQuestionEditorHeight(container, question.showToolbar);
      },
    });
  }

  private checkQuestionEditorHeight(container: HTMLElement, showToolbar: boolean = false): void {
    const wrapper = container.closest('.tiptap-wrapper-with-buttons');
    if (!wrapper) return;

    if (!showToolbar) {
      const content = container.querySelector('.tiptap-editor');
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
  destroyQuestionEditor(question: Question): void {
    if (question.editor && !question.editor.isDestroyed) {
      question.editor.destroy();
      question.editor = undefined;
    }
  }

  isActiveFormat(question: Question, format: string): boolean {
    if (!question.editor || question.editor.isDestroyed) return false;
    try { return question.editor.isActive(format); } catch { return false; }
  }

  toggleFormat(question: Question, format: string): void {
    if (!question.editor || question.editor.isDestroyed) return;
    const chain = question.editor.chain().focus();
    switch (format) {
      case 'bold': chain.toggleBold().run(); break;
      case 'italic': chain.toggleItalic().run(); break;
      case 'underline': chain.toggleUnderline().run(); break;
      case 'bulletList': chain.toggleBulletList().run(); break;
      case 'orderedList': chain.toggleOrderedList().run(); break;
    }
  }

  toggleToolbar(question: Question): void {
    question.showToolbar = !question.showToolbar;
    const container = document.querySelector(
      `[data-question-id="${question.id}"] .tiptap-editor-container`
    ) as HTMLElement;
    if (container) {
      this.checkQuestionEditorHeight(container, question.showToolbar);
    }
  }



  async loadQuestionsForSection(section: Section): Promise<void> {
    section.isLoadingQuestions = true;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: section.id,
          questionPage: 0,
          questionLimit: 10,
          messagePage: 0,
          messageLimit: 10,

        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === section.id);
      if (sec) {
        section.questions = (sec.question || []).map((q: any) => this.mapApiQuestion(q));
        section.questionPage = 0;
        section.hasMoreQuestions = section.questions.length === 10;
        for (const question of section.questions) {
          await this.autoLoadRepliesForMessages(question, section);
        }
      }
    } catch (e) {
      console.error('Error loading questions:', e);
    } finally {
      section.isLoadingQuestions = false;
    }
  }

  async loadMoreQuestions(section: Section): Promise<void> {
    if (section.isLoadingQuestions) return;
    section.questionPage++;
    section.isLoadingQuestions = true;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: section.id,
          questionPage: section.questionPage,
          questionLimit: 10,
          messagePage: 0,
          messageLimit: 10,

        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === section.id);
      if (sec) {
        const newQuestions = (sec.question || []).map((q: any) => this.mapApiQuestion(q));
        section.questions.push(...newQuestions);
        section.hasMoreQuestions = newQuestions.length === 10;
        for (const question of newQuestions) {
          await this.autoLoadRepliesForMessages(question, section);
        }
      } else {
        section.hasMoreQuestions = false;
      }
    } catch (e) {
      console.error('Error loading more questions:', e);
      section.questionPage--;
    } finally {
      section.isLoadingQuestions = false;
    }
  }

  async loadMoreSections(): Promise<void> {
    if (this.isLoadingMoreSections || !this.hasMoreSections) return;
    this.isLoadingMoreSections = true;
    this.sectionPage++;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionPage: this.sectionPage,
          sectionLimit: 10,
          questionLimit: 0
        }
      );
      if (res?.sectionResponses) {
        const newSections = this.mapApiResponseToSections(res.sectionResponses);
        this.sections.push(...newSections);
        this.hasMoreSections = newSections.length === 10;
      }
    } catch (e) {
      console.error('Error loading more sections:', e);
      this.sectionPage--;
    } finally {
      this.isLoadingMoreSections = false;
    }
  }

  async loadMoreMessages(question: Question, section: Section, scrollEl?: HTMLElement): Promise<void> {
    if (question.isLoadingMoreMessages || !question.hasMoreMessages) return;
    question.isLoadingMoreMessages = true;
    question.messagePage++;

    const previousScrollHeight = scrollEl?.scrollHeight ?? 0;
    const previousScrollTop = scrollEl?.scrollTop ?? 0;

    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: section.id,
          questionId: question.id,
          messagePage: question.messagePage,
          messageLimit: 10,
          depthOfChildMessageCount: 1

        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === section.id);
      const q = sec?.question?.find((q: any) => q.questionId === question.id);
      if (q) {
        const newMessages = (q.messages || []).map((m: any) => this.mapApiMessage(m));
        const existingFlat = question.messages.flatMap(m => [m, ...(m.replies || [])]);
        question.messages = this.buildMessageTree([...newMessages, ...existingFlat]);
        question.hasMoreMessages = newMessages.length === 10;
        await this.autoLoadRepliesForMessages(question, section);


        if (scrollEl) {
          setTimeout(() => {
            const newScrollHeight = scrollEl.scrollHeight;
            scrollEl.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
          }, 50);
        }
      } else {
        question.hasMoreMessages = false;
      }
    } catch (e) {
      console.error('Error loading more messages:', e);
      question.messagePage--;
    } finally {
      question.isLoadingMoreMessages = false;
    }
  }

  isOptionSelected(answer: string, optionValue: string): boolean {
    const parsed = this.parseJSON(answer, []);
    return Array.isArray(parsed) && parsed.includes(optionValue);
  }

  getMultiSelectDisplay(answer: string): string {
    const parsed = this.parseJSON(answer, []);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.join(', ') : '-';
  }
  onMessagesScroll(event: Event, question: Question, section: Section): void {
    if (this.isNavigatingToMessage) return;
    const el = event.target as HTMLElement;
    if (el.scrollTop <= 50 && question.hasMoreMessages && !question.isLoadingMoreMessages) {
      this.loadMoreMessages(question, section, el);
    }
  }

  attachFiles(question: Question): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = (event: any) => this.onFileSelected(event, question);
    fileInput.click();
  }

  onFileSelected(event: Event, question: Question): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;


    const totalExisting = question.selectedFiles.length + (question.editingAttachments?.length ?? 0);

    if (totalExisting >= this.MAX_TOTAL_FILES) {
      this.showWarningBanner(question, `Maximum ${this.MAX_TOTAL_FILES} files allowed. You already have ${totalExisting} files.`);
      input.value = '';
      return;
    }

    const remainingSlots = this.MAX_TOTAL_FILES - totalExisting;

    if (input.files.length > remainingSlots) {
      this.showWarningBanner(question, `Up to ${this.MAX_TOTAL_FILES} files can be uploaded at a time.`);
      input.value = '';
      return;
    }

    const skippedLarge: string[] = [];
    const skippedDuplicates: string[] = [];
    let addedCount = 0;

    for (let i = 0; i < input.files.length && addedCount < remainingSlots; i++) {
      const file = input.files[i];

      if (file.size > this.MAX_FILE_SIZE_BYTES) {
        skippedLarge.push(file.name);
        continue;
      }

      const isDuplicate = question.selectedFiles.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        skippedDuplicates.push(file.name);
        continue;
      }

      question.selectedFiles.push(file);
      addedCount++;
    }

    if (skippedLarge.length > 0) {
      this.showWarningBanner(question, `Files exceeding 5MB limit (skipped): ${skippedLarge.join(', ')}`);
    } else if (skippedDuplicates.length > 0) {
      this.showWarningBanner(question, `This file is already attached to your message`);
    }

    input.value = '';
  }

  removeSelectedFile(question: Question, index: number): void {
    question.selectedFiles.splice(index, 1);
  }

  showWarningBanner(question: Question, message: string): void {
    question.warningMessage = message;
    question.showWarning = true;
    if (question.warningTimer) clearTimeout(question.warningTimer);
    question.warningTimer = setTimeout(() => this.dismissWarning(question), 5000);
  }

  dismissWarning(question: Question): void {
    question.showWarning = false;
    question.warningMessage = '';
    question.warningTimer = null;
  }

  async sendMessage(question: Question, notifyUser: boolean = false): Promise<void> {
    question.showSendDropdown = false;
    const html = question.editor?.getHTML() ?? question.newMessage ?? '';
    const text = html.replace(/<[^>]*>/g, '').trim();
    if (!text && question.selectedFiles.length === 0) return;
    question.newMessage = html;
    if (this.isSendingMessage || this.fileUploadInProgress) return;

    this.isSendingMessage = true;
    this.uploadedFilesData = [];

    try {

      if (question.isEditMode && question.editingMessage) {
        const subCommands: UpdateMessageCommand['commands'] = [
          {
            type: ConversationCommandType.UPDATE_MESSAGE_CONTENT as 'updateMessageContent',
            message: html
          }
        ];

        // 1. Find removed attachments by diffing original vs current editingAttachments
        const originalAttachments = question.editingMessage.attachments ?? [];
        const currentIds = new Set((question.editingAttachments ?? []).map(a => a.id));
        const removedIds = originalAttachments
          .filter(a => !currentIds.has(a.id))
          .map(a => a.id);

        if (removedIds.length > 0) {
          subCommands.push({
            type: ConversationCommandType.DELETE_MESSAGE_ATTACHMENTS as 'deleteMessageAttachments',
            attachmentMappingIds: removedIds
          });
        }

        // 2. Upload and attach any new files
        if (question.selectedFiles.length > 0) {
          this.fileUploadInProgress = true;
          await this.getPresignedUrlsForFiles(question);
          const newAttachments: { fileKey: string; fileName: string }[] = [];
          for (const uploadedFile of this.uploadedFilesData) {
            const { file, presignedUrl, fileKey, originalFileName } = uploadedFile;
            try {
              const res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
              if (res && res.headers && res.headers.get(ETAG)) {
                newAttachments.push({ fileName: originalFileName, fileKey });
              }
            } catch (error) {
              console.error(`Error uploading file ${file.name}:`, error);
            }
          }
          this.fileUploadInProgress = false;
          if (newAttachments.length > 0) {
            subCommands.push({
              type: ConversationCommandType.ADD_MESSAGE_ATTACHMENTS as 'addMessageAttachments',
              attachments: newAttachments
            });
          }
        }

        const command: UpdateMessageCommand = {
          type: ConversationCommandType.UPDATE_MESSAGE as 'updateMessage',
          commands: subCommands
        };

        await this.assessmentApiHelperService.updateQuestionConversation(
          this.assessmentId, question.id, question.editingMessage.id, [command], notifyUser
        );
        await this.refreshQuestionMessages(question);
        this.cancelEdit(question);
        return;
      }


      const processedAttachments: { fileName: string; fileKey: string }[] = [];
      if (question.selectedFiles.length > 0) {
        this.fileUploadInProgress = true;
        await this.getPresignedUrlsForFiles(question);
        for (const uploadedFile of this.uploadedFilesData) {
          const { file, presignedUrl, fileKey, originalFileName } = uploadedFile;
          try {
            const res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
            if (res && res.headers && res.headers.get(ETAG)) {
              processedAttachments.push({ fileName: originalFileName, fileKey });
            }
          } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error);
          }
        }
        this.fileUploadInProgress = false;
      }

      const command: PostMessageCommand = {
        type: ConversationCommandType.POST_MESSAGE as 'postMessage',
        message: html || '',
        messageParentId: question.isReplyMode && question.replyingToMessage
          ? (question.replyingToMessage.parentId ?? question.replyingToMessage.id)
          : 0,
        attachments: processedAttachments
      };
      await this.assessmentApiHelperService.createQuestionConversation(this.assessmentId, question.id, [command], notifyUser);
      await this.refreshQuestionMessages(question);

    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      this.isSendingMessage = false;
      this.fileUploadInProgress = false;
      this.uploadedFilesData = [];
      question.newMessage = '';
      question.editor?.commands.setContent('');
      question.selectedFiles = [];
      question.showToolbar = false;
      question.showWarning = false;
      if (question.isReplyMode) this.cancelReply(question);
    }
  }

  async deleteMessage(question: Question, messageId: number): Promise<void> {
    const command: DeleteMessageCommand = {
      type: ConversationCommandType.DELETE_MESSAGE as 'deleteMessage',
      messageId
    };

    try {
      await this.assessmentApiHelperService.updateQuestionConversation(
        this.assessmentId, question.id, messageId, [command]
      );
      await this.refreshQuestionMessages(question);
    } catch (e) {
      console.error('Error deleting message:', e);
    }
  }

  startEdit(question: Question, message: ConversationMessage): void {
    question.isEditMode = true;
    question.editingMessage = message;
    question.newMessage = message.text.replace(/<[^>]*>/g, '');
    question.editor?.commands.setContent(message.text);
    question.isReplyMode = false;
    question.replyingToMessage = null;
    question.replyingToMessageText = '';
    question.editingAttachments = message.attachments ? [...message.attachments] : [];
    question.selectedFiles = [];
  }

  cancelEdit(question: Question): void {
    question.isEditMode = false;
    question.editingMessage = null;
    question.newMessage = '';
    question.editor?.commands.setContent('');
    question.editingAttachments = [];
    question.selectedFiles = [];
  }

  removeEditingAttachment(question: Question, index: number): void {
    question.editingAttachments?.splice(index, 1);
  }




  private async refreshQuestionMessages(question: Question): Promise<void> {
    try {

      const section = this.sections.find(s =>
        s.questions.some(q => q.id === question.id)
      );
      if (!section) return;
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: section?.id,
          questionId: question.id,
          messagePage: 0,
          messageLimit: 50,

        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === section?.id);
      const q = sec?.question?.find((q: any) => q.questionId === question.id);
      if (q) {
        question.messages = this.buildMessageTree(
          (q.messages || []).map((m: any) => this.mapApiMessage(m))
        );
        await this.autoLoadRepliesForMessages(question, section);
        question.showChat = true;
        setTimeout(() => {
          const allAreas = document.querySelectorAll('.messages-area');
          allAreas.forEach(area => { area.scrollTop = area.scrollHeight; });
        }, 100);
      }


    } catch (e) {
      console.error('Error refreshing messages:', e);
    }
  }

  async loadAllReplies(question: Question, parentMessage: ConversationMessage): Promise<void> {
    if (!parentMessage.childMessagesCount || parentMessage.childMessagesCount === 0) return;
    try {
      const section = this.sections.find(s => s.questions.some(q => q.id === question.id));
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
        this.assessmentId,
        {
          sectionId: section?.id,
          questionId: question.id,
          conversationId: parentMessage.id,
          messagePage: 0,
          messageLimit: 50,
          depthOfChildMessageCount: 1
        }
      );
      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === section?.id);
      const q = sec?.question?.find((q: any) => q.questionId === question.id);
      if (q) {
        parentMessage.replies = (q.messages || [])
          .map((m: any) => this.mapApiMessage(m))
          .filter((m: ConversationMessage) => m.parentId === parentMessage.id);
        question.collapsedReplies.set(parentMessage.id, false);
      }
    } catch (e) {
      console.error('Error loading replies:', e);
    }
  }

  isCurrentUser(message: ConversationMessage): boolean {
    return message.senderType === 'ADMIN_USER';
  }

  isMessageOwner(message: ConversationMessage): boolean {
    const currentUserId = this.authService.getUserInfo()?.applicationUserId;
    return message.senderUserId === currentUserId;
  }

  getVisibleReplies(message: ConversationMessage, question: Question): ConversationMessage[] {
    if (!message.replies || message.replies.length === 0) return [];
    if (!question.collapsedReplies.has(message.id) && message.replies.length > this.maxVisibleReplies) {
      question.collapsedReplies.set(message.id, true);
    }
    const sorted = [...message.replies].sort((a, b) => a.id - b.id);
    return question.collapsedReplies.get(message.id) ? sorted.slice(-this.maxVisibleReplies) : sorted;
  }

  getHiddenRepliesCount(message: ConversationMessage): number {
    const count = (message.replies?.length ?? 0) - this.maxVisibleReplies;
    return count > 0 ? count : 0;
  }

  shouldShowExpandButton(message: ConversationMessage, question: Question): boolean {
    return !!message.replies &&
      message.replies.length > this.maxVisibleReplies &&
      (question.collapsedReplies.get(message.id) ?? false);
  }

  toggleRepliesExpansion(messageId: number, question: Question): void {
    question.collapsedReplies.set(messageId, !(question.collapsedReplies.get(messageId) ?? false));
  }

  onRaiseRisk(question: Question): void {
    const section = this.sections.find(s => s.questions.some((q: Question) => q.id === question.id));
    this.riskDrawerService.open({
      assessmentId: this.assessmentId,
      questionId: question.id,
      sections: this.sections,
      editData: null,
      isEditMode: false,
      source: 'QUESTION_AND_RESPONSE',
      riskMatrix: this.riskMatrix,
      sectionContext: section
        ? { sectionId: section.id, sectionName: section.title, questionText: question.text }
        : undefined,
    });
  }
  onCreateTask(question: Question): void {
    this.riskViewDrawerService.triggerCreateTask({
      riskData: null,
      assessmentId: this.assessmentId,
      sections: this.assessmentSections,
      risks: this.risks,
      questionId: question.id,
      source: 'QUESTION_AND_RESPONSE',
    });
  }

  async onAcceptAnswer(question: Question): Promise<void> {
    if (question.status == AssessmentQuestionStatus.ACCEPTED) {
      return
    }
    if (!this.templateId) {
      this.snackbarService.openSnack("Invalid template Id!");
      return
    }
    question.approveLoading = true;
    const payload = buildApproveQuestionResponseCommand(question.id);
    const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
    this.assessmentApiHelperService.updateTemplateDetails(this.templateId, payload, _url, false)
      .subscribe({
        next: async (res) => {
          question.status = AssessmentQuestionStatus.ACCEPTED;
          this.snackbarService.openSnack(assessmentApproverAnswerMessage());
          question.approveLoading = false;
        },
        error: (e: Error) => {
          question.approveLoading = false;
        },
      });
  }

  formatTimestamp(date: Date): string {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let h = date.getHours();
    const min = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${m[date.getMonth()]} ${date.getDate()}, ${h.toString().padStart(2, '0')}:${min} ${ampm}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  startReply(question: Question, message: ConversationMessage): void {
    question.isReplyMode = true;
    question.replyingToMessage = message;
    const plainText = message.text.replace(/<[^>]*>/g, '');
    question.replyingToMessageText = plainText.length > 100
      ? plainText.substring(0, 100) + '...'
      : plainText;
  }

  cancelReply(question: Question): void {
    question.isReplyMode = false;
    question.replyingToMessage = null;
    question.replyingToMessageText = '';
  }
  private async getPresignedUrlsForFiles(question: Question): Promise<void> {
    for (const file of question.selectedFiles) {
      const params = {
        fileName: file.name,
        contentType: file.type,
        purpose: QUESTIONNAIRE_CONVERSATION_ATTACHMENT,
      };

      try {
        const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
        if (imageInfo) {
          this.uploadedFilesData.push({
            file,
            presignedUrl: imageInfo.presignedUrl,
            fileKey: imageInfo.fileKey,
            originalFileName: file.name
          });
        }
      } catch (error) {
        console.error('Error getting presigned URL for file:', file.name, error);
      }
    }
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
        this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: attachment.name || '',
            requestRid: this.assessmentId,
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
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  }
  private buildMessageTree(messages: ConversationMessage[]): ConversationMessage[] {
    const messageMap = new Map<number, ConversationMessage>();
    const rootMessages: ConversationMessage[] = [];


    messages.forEach(m => {
      m.replies = [];
      messageMap.set(m.id, m);
    });


    messages.forEach(m => {
      if (m.parentId && m.parentId !== null) {
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

  private async autoLoadRepliesForMessages(question: Question, section: Section): Promise<void> {
    const messagesWithChildren = question.messages.filter(
      m => m.childMessagesCount && m.childMessagesCount > 0
    );

    for (const message of messagesWithChildren) {
      try {
        const res = await this.assessmentApiHelperService.getAssessmentSectionDetail(
          this.assessmentId,
          {
            sectionId: section.id,
            questionId: question.id,
            conversationId: message.id,
            messagePage: 0,
            messageLimit: 50,
            depthOfChildMessageCount: message.childMessagesCount
          }
        );
        const sec = res?.sectionResponses?.find((s: any) => s.sectionId === section.id);
        const q = sec?.question?.find((q: any) => q.questionId === question.id);
        if (q) {
          message.replies = (q.messages || [])
            .map((m: any) => this.mapApiMessage(m))
            .filter((m: ConversationMessage) => m.parentId === message.id);
        }
      } catch (e) {
        console.error(`Error auto-loading replies for message ${message.id}:`, e);
      }
    }
  }

  async loadFocusedView(target: DiscussionLogNavigationTarget): Promise<void> {
    this.isFocusedMode = true;
    this.isLoading = true;
    this.sections = [];
    this.hasMoreSections = false;

    try {
      const res = await this.assessmentApiHelperService.getAssessmentSectionDetailDirect(
        this.assessmentId,
        {
          sectionId: target.sectionId,
          questionId: target.questionId,
          messagePage: target.conversationPage,
          messageLimit: 10,
        }
      );

      const sec = res?.sectionResponses?.find((s: any) => s.sectionId === target.sectionId);
      if (sec) {
        const section = this.mapApiResponseToSections([sec])[0];
        section.isExpanded = true;

        const question = section.questions.find(q => q.id === target.questionId);
        if (question) {
          question.isExpanded = true;
          question.showChat = target.messageId > 0;


          if (target.messageId > 0) {
            await this.autoLoadRepliesForMessages(question, section);
            if (target.messageId !== target.parentId) {
              question.collapsedReplies.set(target.parentId, false);
            }
          }
        }


        this.sections = [section];
        setTimeout(() => {
          this.elementRef.nativeElement.scrollTo({
            top: this.elementRef.nativeElement.scrollHeight,
            behavior: 'smooth'
          });
        }, 300);



        setTimeout(() => {
          const container = document.querySelector(
            `[data-question-id="${target.questionId}"] .tiptap-editor-container`
          ) as HTMLElement;
          if (container && question && !question.editor) {
            this.initQuestionEditor(question, container);
          }
        }, 200);
        if (target.messageId > 0) {
          setTimeout(() => {
            this.isNavigatingToMessage = true;
            this.scrollToMessageInContainer(target.messageId, target.questionId);

            setTimeout(() => {
              this.highlightedMessageId = target.messageId;
              if (this.highlightTimer) clearTimeout(this.highlightTimer);
              this.highlightTimer = setTimeout(() => {
                this.highlightedMessageId = null;
              }, 3000);


              setTimeout(() => {
                this.isNavigatingToMessage = false;
              }, 600);

            }, 450);

          }, 500);
        } else { }
      }
    } catch (e) {
      console.error('Error loading focused view:', e);
    } finally {
      this.isLoading = false;
    }
  }

  scrollToMessageInContainer(messageId: number, questionId: number): void {
    const hostEl = this.elementRef.nativeElement as HTMLElement;


    const messagesArea = hostEl.querySelector(
      `[data-question-id="${questionId}"] .messages-area`
    ) as HTMLElement;

    const messageEl = hostEl.querySelector(
      `[data-message-id="${messageId}"]`
    ) as HTMLElement;

    if (!messagesArea || !messageEl) return;

    const containerTop = messagesArea.getBoundingClientRect().top;
    const messageTop = messageEl.getBoundingClientRect().top;
    const offset = messageTop - containerTop;
    const targetScroll = messagesArea.scrollTop + offset - (messagesArea.clientHeight / 2);

    messagesArea.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }



  clearFocusedMode(): void {
    this.isFocusedMode = false;
    this.highlightedMessageId = null;
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.sections = [];
    this.sectionPage = 0;
    this.hasMoreSections = false;
    this.loadSections();
  }

  async openFileViewer(file: { fileKey: string; fileName: string }): Promise<void> {
    if (!file.fileKey) return;
    try {
      const imageInfo = await this.apiHelperService.getPresignedUrl({ fileKey: file.fileKey });
      if (imageInfo?.presignedUrl) {
        this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: file.fileName || '',
            requestRid: this.assessmentId,
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
      console.error('Error opening file viewer:', error);
    }
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

  get showActionButton() {
    return this.assessmentService.assessmentCompleted(this.status) || this.assessmentService.assessmentCancelled(this.status) ? false : true
  }
}
