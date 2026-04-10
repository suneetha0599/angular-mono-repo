
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, signal, inject, ElementRef, ViewChild, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiResponse } from '@admin-core/models/network/ApiResponse';
import { Subject, of, delay, finalize, debounceTime, distinctUntilChanged, switchMap, catchError, tap, takeUntil, BehaviorSubject, Observable } from 'rxjs';
import moment from 'moment';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SelectedFile, FileValidationResult, Clarification, DialogData, User } from '@admin-core/models/request-management/clarification';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { CommentThreadingService } from '../../comment-threading-service.service';
import { DSR_ATTACHMENT, DSR_DOCUMENT_UPLOAD } from '@admin-core/constants/constants';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { RequestDocuments } from '@admin-core/models/request-management/DsrRequest';
import { UserService } from '@admin-core/services/user/user.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';
interface CommentRecord {
  id: number;
  content: string;
  author: string;
  authorId: number;
  timestamp: string;
  avatar: string;
  isReply: boolean;
  parentId?: number;
  attachments: CommentAttachment[];
  metadata?: {
    mentionedUserIds: number[];
  };
  createdAt: string;
  isSelfReply?: boolean;
  updatedAt?: string;
}

interface CommentAttachment {
  fileKey: string;
  eTag?: string;
  fileName?: string;
  fileSize?: number;
}

interface CreateCommentRequest {
  content: string;
  parentId?: number;
  attachments?: CommentAttachment[];
  metadata?: {
    mentionedUserIds: number[];
    authorId?: number
  };
}

type TabId = 'form' | 'comments';

const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'l, LTS'
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
}
@Component({
  selector: 'app-request-clarification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, CustomMatTextareaComponent, MatCheckboxModule, MatTabsModule, LoadingButtonComponent, MatDatepickerModule, MatNativeDateModule,],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ],
  templateUrl: './request-clarification.component.html',
  styleUrls: ['./request-clarification.component.scss']
})

export class RequestClarificationComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiHelperService = inject(ApiHelperService);
  private readonly threadingService = inject(CommentThreadingService);

  private readonly activeRequests = new Set<string>();
  private readonly requestSubject$ = new Subject<{ key: string, observable: Observable<any> }>();

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('commentFileInput', { static: false }) commentFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('threadingCanvas', { static: false }) threadingCanvas!: ElementRef<HTMLCanvasElement>;

  private threadingInitialized = false;
  private redrawTimeoutId?: number;
  readonly activeTab = signal<any>('form');

  readonly commentsLoading = signal<boolean>(false);
  readonly commentSubmitLoading = signal<boolean>(false);
  readonly commentsData = signal<CommentRecord[]>([]);
  readonly showCommentAttachments = signal<boolean>(false);

  readonly showResolutionDialog = signal<boolean>(false);
  readonly clarificationsLoading = signal<boolean>(false);
  readonly submitLoading = signal<boolean>(false);
  readonly showDocumentSelector = signal<boolean>(false);
  readonly isDragOver = signal<boolean>(false);
  readonly fileUploadProgress = signal<Map<string, number>>(new Map());
  readonly resolveLoading = signal<boolean>(false);
  readonly completeLoading = signal<boolean>(false);
  readonly resolveClarificationLoading = signal<boolean>(false);

  newCommentText = '';
  commentAttachments: SelectedFile[] = [];
  editingCommentId: number | null = null;
  replyToCommentId: number | null = null;
  mentionResults: User[] = [];
  showMentionList = false;

  resolutionNote: string = '';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  readonly allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  readonly filePurposeOptions = [
    { value: DSR_ATTACHMENT, label: 'DSR Attachment', description: 'General attachments for DSR requests' },
    { value: DSR_DOCUMENT_UPLOAD, label: 'DSR Document Upload', description: 'Formal document uploads for DSR processing' }
  ];

  clarificationForm: FormGroup;
  clarifications: Clarification[] = [];
  userList: User[] = [];
  selectedFiles: SelectedFile[] = [];
  documentsList: string[] = [];
  selectedClarificationId: number | null = null;
  selectedFilePurpose = DSR_ATTACHMENT;
  isLoading = false;
  readonly requestRid: number;
  readonly dsrFormId: number;
  dsrRequestAttachments: RequestDocuments[] = [];
  selectedRequestDocuments: string[] = [];
  title: string = "Request Clarification";
  description: string = "Manage clarification requests and comments for this DSR.";
  private userDisplayNameCache = new Map<number, string>();
  rightPanelTabs: { id: string; label: string }[] = [
    { id: 'form', label: 'Details' },
    { id: 'comments', label: 'Comments' }
  ];
  selectedTabIndex: number = 0
  showClarificationDetails: boolean = false;

  constructor(
    private userService: UserService,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<RequestClarificationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.requestRid = data?.requestRid || 0;
    this.dsrFormId = data?.dsrFormId || data?.requestRid || 0;

    // if (data?.dsrRequestDetails?.commonDocuments) {
    //   this.dsrRequestAttachments = data.dsrRequestDetails.commonDocuments;
    // }

    this.clarificationForm = this.createClarificationForm();
    this.initializeRequestDeduplication();
    this.setupThreadingEventListeners();
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      await this.initializeComponentData();
    } catch (error) {
      console.error('Error initializing clarification component:', error);
      this.handleInitializationError(error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.cleanupComponent();
  }

  private setupThreadingEventListeners(): void {
    document.addEventListener('requestRedraw', this.handleThreadingRedraw.bind(this));
  }

  private handleThreadingRedraw = (): void => {
    if (this.threadingInitialized && this.commentsData().length > 0) {
      if (this.redrawTimeoutId) {
        clearTimeout(this.redrawTimeoutId);
        this.redrawTimeoutId = undefined;
      }
      this.threadingService.drawAllThreadingLines(this.commentsData());
    }
  };

  private async waitForCanvasReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkCanvas = () => {
        const canvas = this.threadingCanvas?.nativeElement;
        if (canvas && canvas.offsetParent !== null) {
          resolve();
        } else {
          setTimeout(checkCanvas, 50);
        }
      };
      checkCanvas();
    });
  }

  private drawThreadingIfReady(): void {
    const commentsData = this.commentsData();
    if (commentsData.length > 0 && this.threadingInitialized) {
      if (this.threadingService.areCommentElementsReady(commentsData)) {
        this.threadingService.drawAllThreadingLines(commentsData);
      } else {
        this.retryDrawThreading(1);
      }
    }
  }

  private retryDrawThreading(attempt: number): void {
    if (attempt > 3) {
      console.warn('Threading drawing failed after 3 attempts');
      return;
    }

    const delay = Math.min(100 * Math.pow(2, attempt - 1), 500);
    setTimeout(() => {
      const commentsData = this.commentsData();
      if (this.threadingService.areCommentElementsReady(commentsData)) {
        this.threadingService.drawAllThreadingLines(commentsData);
      } else {
        this.retryDrawThreading(attempt + 1);
      }
    }, delay);
  }

  private resetThreading(): void {
    if (this.threadingInitialized) {
      this.threadingService.destroy();
      this.threadingInitialized = false;
    }

    if (this.redrawTimeoutId) {
      clearTimeout(this.redrawTimeoutId);
      this.redrawTimeoutId = undefined;
    }
  }

  setActiveTab(tab: MatTabChangeEvent): void {
    const tabId = this.rightPanelTabs[tab.index].id
    this.activeTab.set(tabId);

    if (tabId === 'comments') {
      if (this.selectedClarificationId) {
        this.fetchClarificationComments();
      } else {
        setTimeout(() => {
          this.initializeThreadingForTab();
        }, 100);
      }
    }

    this.cdr.markForCheck();
  }

  private async initializeThreadingForTab(): Promise<void> {
    if (this.threadingCanvas?.nativeElement) {
      this.resetThreading();
      this.threadingService.reinitializeAfterTabSwitch();
      setTimeout(() => {
        this.initializeThreading();
      }, 200);
    }
  }

  selectClarification(clarification: Clarification): void {
    this.showClarificationDetails = true
    this.selectedClarificationId = clarification.id;
    this.clarificationForm = this.createClarificationForm(clarification);
    this.updateSelectedFiles(clarification.attachments);

    this.resetCommentForm();
    this.resetThreading();

    if (this.activeTab() === 'comments') {
      this.fetchClarificationComments();
    }

    this.cdr.markForCheck();
  }

  private scheduleThreadingRedraw(): void {
    if (this.threadingInitialized) {
      setTimeout(() => {
        this.drawThreadingIfReady();
      }, 100);
    }
  }

  private mapApiCommentsToUI(apiComments: any[]): CommentRecord[] {
    return apiComments.map(apiComment => {
      const extractAuthorId = (comment: any): number => {
        if (comment.authorId && typeof comment.authorId === 'number') {
          return comment.authorId;
        }
        if (comment.metadata?.authorId) {
          return comment.metadata.authorId;
        }
        if (comment.content) {
          const mentionMatch = comment.content.match(/@(\w+\s*\w*)/);
          if (mentionMatch) {
            const mentionedName = mentionMatch[1];
            const user = this.userList.find(u =>
              u.name.toLowerCase().includes(mentionedName.toLowerCase()) ||
              u.displayName?.toLowerCase().includes(mentionedName.toLowerCase())
            );
            if (user) return user.id;
          }
        }

        const displayName = this.getUserDisplayName(comment.authorId || 0);
        const user = this.userList.find(u => u.name === displayName || u.displayName === displayName);
        return user?.id || 0;
      };

      const authorId = extractAuthorId(apiComment);
      const author = this.getUserDisplayName(authorId) || 'Unknown User';

      return {
        id: apiComment.commentId || apiComment.id,
        content: apiComment.content || '',
        author,
        authorId,
        timestamp: this.formatTimestamp(apiComment.createdAt),
        avatar: this.generateAvatar(authorId),
        isReply: (apiComment.parentId && apiComment.parentId !== 0) || false,
        parentId: apiComment.parentId || undefined,
        attachments: apiComment.attachments || [],
        metadata: apiComment.metadata || { mentionedUserIds: [] },
        createdAt: apiComment.createdAt,
        updatedAt: apiComment.updatedAt,
        isSelfReply: false
      };
    });
  }

  private sortCommentsThreaded(comments: CommentRecord[]): CommentRecord[] {
    const safeDate = (date?: string) => new Date(date ?? 0).getTime();
    const normParent = (id?: number | null) => id ?? 0;
    const childrenMap = new Map<number, CommentRecord[]>();
    for (const comment of comments) {
      const parentId = normParent(comment.parentId);
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(comment);
    }

    const detectAndMarkSelfReplies = (parentId: number, replies: CommentRecord[]): void => {
      const parent = comments.find(c => c.id === parentId);
      if (parent) {
        replies.forEach(reply => {
          reply.isSelfReply = this.isSelfReplyDetection(parent, reply);
        });
      }
    };

    childrenMap.forEach((replies, parentId) => {
      if (parentId !== 0) {
        detectAndMarkSelfReplies(parentId, replies);
      }
      replies.sort((a, b) => safeDate(a.createdAt) - safeDate(b.createdAt));
    });

    const buildThread = (parentId: number): CommentRecord[] => {
      const children = childrenMap.get(parentId) || [];
      return children.flatMap(child => [child, ...buildThread(child.id)]);
    };

    return buildThread(0);
  }

  private isSelfReplyDetection(parentComment: CommentRecord, replyComment: CommentRecord): boolean {
    if (parentComment.authorId && replyComment.authorId &&
      parentComment.authorId > 0 && replyComment.authorId > 0) {
      return parentComment.authorId === replyComment.authorId;
    }

    const normalizeAuthor = (author: string): string => {
      return author.trim().toLowerCase().replace(/\s+/g, ' ');
    };

    if (parentComment.author && replyComment.author) {
      const parentAuthor = normalizeAuthor(parentComment.author);
      const replyAuthor = normalizeAuthor(replyComment.author);

      if (parentAuthor === replyAuthor && parentAuthor !== 'unknown user') {
        return true;
      }
    }

    if (parentComment.avatar && replyComment.avatar &&
      parentComment.avatar === replyComment.avatar &&
      parentComment.avatar !== 'UN') {
      return true;
    }
    return false;
  }

  async submitComment(): Promise<void> {
    if ((!this.newCommentText.trim() && this.commentAttachments.length === 0) ||
      this.commentSubmitLoading() || !this.selectedClarificationId) {
      return;
    }
    const requestKey = `submit_comment_${this.selectedClarificationId}_${Date.now()}`;

    if (this.activeRequests.has(requestKey)) {
      return;
    }
    this.commentSubmitLoading.set(true);
    this.activeRequests.add(requestKey);

    try {
      let uploadedAttachments: CommentAttachment[] = [];
      if (this.commentAttachments.length > 0) {
        uploadedAttachments = await this.uploadCommentAttachments();
      }

      const payload: CreateCommentRequest = {
        content: this.newCommentText.trim(),
        parentId: this.replyToCommentId || 0,
        attachments: uploadedAttachments,
        metadata: {
          mentionedUserIds: this.extractMentionedUserIds(),
          authorId: this.getCurrentUserId()
        }
      };

      if (this.editingCommentId) {
        await this.updateComment(this.editingCommentId, payload);
      } else {
        await this.createComment(payload);
      }

      this.resetCommentForm();
      await this.fetchClarificationComments();

      this.showSuccessMessage(this.editingCommentId ? 'Comment updated successfully' : 'Comment added successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      this.showErrorMessage(error as Error);
    } finally {
      this.commentSubmitLoading.set(false);
      this.activeRequests.delete(requestKey);
      this.cdr.markForCheck();
    }
  }

  private getCurrentUserId(): number {
    return 0;
  }

  private getUserDisplayName(assignedToId: number): string {
    if (!assignedToId || assignedToId === 0) {
      return 'System User';
    }

    if (this.userDisplayNameCache.has(assignedToId)) {
      return this.userDisplayNameCache.get(assignedToId)!;
    }

    const user = this.userList.find(user => user.id === assignedToId);
    const displayName = user ? (user.displayName || user.name || 'Unknown User') : `User ${assignedToId}`;

    this.userDisplayNameCache.set(assignedToId, displayName);

    return displayName;
  }

  private generateAvatar(userId: number, isSelfReply: boolean = false): string {
    const user = this.userList.find(u => u.id === userId);
    let initials = 'UN';

    if (user) {
      const names = user.name.split(' ');
      initials = names.length > 1 ?
        (names[0][0] + names[1][0]).toUpperCase() :
        names[0].substring(0, 2).toUpperCase();
    }

    return initials;
  }

  async fetchClarificationComments(): Promise<void> {
    if (!this.selectedClarificationId) {
      return;
    }

    const requestKey = `comments_${this.dsrFormId}_${this.selectedClarificationId}`;
    if (this.activeRequests.has(requestKey)) {
      return;
    }

    this.commentsLoading.set(true);
    this.activeRequests.add(requestKey);

    try {
      const response = await this.apiHelperService.getClarificationComments(
        this.dsrFormId,
        this.selectedClarificationId,
        { page: 1, size: 50 }
      );

      const comments = response?.taskComments || [];
      console.log('Raw API Comments:', comments);

      const mappedComments = this.mapApiCommentsToUI(comments);
      console.log('Mapped Comments:', mappedComments);

      const sortedComments = this.sortCommentsThreaded(mappedComments);
      console.log('Sorted Comments with Self-Replies:', sortedComments.filter(c => c.isSelfReply));

      this.commentsData.set(sortedComments);
      this.cdr.detectChanges();

      if (sortedComments.length > 0) {
        setTimeout(() => {
          this.initializeThreading();
        }, 150);
      }
    } catch (error) {
      console.error('Error fetching clarification comments:', error);
      this.commentsData.set([]);
      this.showErrorMessage(new Error('Failed to load comments'));
    } finally {
      this.commentsLoading.set(false);
      this.activeRequests.delete(requestKey);
      this.cdr.markForCheck();
    }
  }

  private async initializeThreading(): Promise<void> {
    if (!this.threadingCanvas?.nativeElement) {
      console.warn('Threading canvas element not available');
      return;
    }

    if (this.threadingInitialized) {
      this.resetThreading();
    }

    try {
      await this.waitForCanvasReady();

      const initialized = this.threadingService.initializeCanvas(this.threadingCanvas.nativeElement);
      if (initialized) {
        this.threadingInitialized = true;
        console.log('Enhanced threading service initialized successfully');

        setTimeout(() => {
          this.drawThreadingIfReady();
        }, 250);
      }
    } catch (error) {
      console.error('Failed to initialize enhanced comment threading:', error);
    }
  }

  trackCommentById(index: number, comment: CommentRecord): string {
    return `${comment.id}-${comment.isSelfReply ? 'self' : 'other'}-${comment.parentId || 'root'}`;
  }

  debugSelfReplies(): void {
    const comments = this.commentsData();
    const selfReplies = comments.filter(c => c.isSelfReply);
    console.log('Self-Reply Comments:', selfReplies);

    selfReplies.forEach(reply => {
      const parent = comments.find(c => c.id === reply.parentId);
      console.log(`Self-Reply Detection:`, {
        parent: {
          id: parent?.id,
          author: parent?.author,
          authorId: parent?.authorId,
          avatar: parent?.avatar
        },
        reply: {
          id: reply.id,
          author: reply.author,
          authorId: reply.authorId,
          avatar: reply.avatar
        },
        detection: this.isSelfReplyDetection(parent!, reply)
      });
    });
  }

  private cleanupComponent(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.threadingService) {
      this.threadingService.destroy();
    }
    this.threadingInitialized = false;

    if (this.redrawTimeoutId) {
      clearTimeout(this.redrawTimeoutId);
      this.redrawTimeoutId = undefined;
    }

    document.removeEventListener('requestRedraw', this.handleThreadingRedraw);

    this.activeRequests.clear();
    this.clarifications = [];
    this.selectedFiles = [];
    this.fileUploadProgress.set(new Map());
    this.userDisplayNameCache.clear();
  }

  private async createComment(payload: CreateCommentRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const subscription = this.apiHelperService.postClarificationComment(
        payload,
        this.dsrFormId,
        this.selectedClarificationId!
      ).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          reject(new Error(`Failed to create comment: ${error.message || 'Unknown error'}`));
          return of(null);
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            resolve(response);
          }
        },
        complete: () => subscription.unsubscribe()
      });
    });
  }

  private async updateComment(commentId: number, payload: any): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      const subscription = this.apiHelperService.patchClarificationComment(
        payload,
        this.dsrFormId,
        this.selectedClarificationId!,
        commentId
      ).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          reject(new Error(`Failed to update comment: ${error.message || 'Unknown error'}`));
          return of(null);
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            resolve(response);
          }
        },
        complete: () => subscription.unsubscribe()
      });
    });
  }

  async deleteComment(commentId: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        const subscription = this.apiHelperService.deleteClarificationComment(
          this.dsrFormId,
          this.selectedClarificationId!,
          commentId
        ).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: resolve,
          error: reject,
          complete: () => subscription.unsubscribe()
        });
      });

      await this.fetchClarificationComments();
      this.showSuccessMessage('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      this.showErrorMessage(error as Error);
    }
  }

  onReplyComment(comment: CommentRecord): void {
    this.replyToCommentId = comment.id;
    this.editingCommentId = null;
    this.newCommentText = `@${comment.author} `;
    this.focusCommentInput();
  }

  onEditComment(comment: CommentRecord): void {
    this.editingCommentId = comment.id;
    this.replyToCommentId = comment.parentId || null;
    this.newCommentText = comment.content;
    this.commentAttachments = comment.attachments.map(att => ({
      file: new File([], att.fileName || 'attachment'),
      name: att.fileName || 'attachment',
      size: att.fileSize || 0,
      type: 'application/octet-stream',
      id: this.generateFileId()
    }));
    this.focusCommentInput();
  }

  cancelCommentEdit(): void {
    this.resetCommentForm();
  }

  private resetCommentForm(): void {
    this.newCommentText = '';
    this.editingCommentId = null;
    this.replyToCommentId = null;
    this.commentAttachments = [];
    this.mentionResults = [];
    this.showMentionList = false;
  }

  private focusCommentInput(): void {
    setTimeout(() => {
      const textarea = document.querySelector('#commentTextarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }

  onCommentFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    this.processCommentFiles(files);

    if (target) {
      target.value = '';
    }
  }

  openCommentFileExplorer(): void {
    this.commentFileInput?.nativeElement?.click();
  }

  private processCommentFiles(files: File[]): void {
    const validFiles: SelectedFile[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        const selectedFile: SelectedFile = {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          id: this.generateFileId()
        };

        const existingFile = this.commentAttachments.find(f =>
          f.name === file.name && f.size === file.size);

        if (!existingFile) {
          validFiles.push(selectedFile);
        } else {
          errors.push(`File "${file.name}" is already selected`);
        }
      } else {
        errors.push(...validation.errors);
      }
    });

    this.commentAttachments = [...this.commentAttachments, ...validFiles];

    if (errors.length > 0) {
      console.warn('Comment file selection errors:', errors);
    }
  }

  removeCommentAttachment(fileId: string): void {
    this.commentAttachments = this.commentAttachments.filter(f => f.id !== fileId);
  }

  private async uploadCommentAttachments(): Promise<CommentAttachment[]> {
    const uploadedAttachments: CommentAttachment[] = [];

    for (const file of this.commentAttachments) {
      try {
        const uploadResult = await this.uploadSingleCommentFile(file);
        uploadedAttachments.push(uploadResult);
      } catch (error) {
        console.error(`Failed to upload comment attachment ${file.name}:`, error);
        throw error;
      }
    }

    return uploadedAttachments;
  }

  private async uploadSingleCommentFile(file: SelectedFile): Promise<CommentAttachment> {
    const uploadParams = {
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      purpose: DSR_ATTACHMENT
    };

    const presignedResponse = await this.apiHelperService.uploadPresignedUrl(uploadParams);

    if (!presignedResponse?.presignedUrl) {
      throw new Error('Failed to get presigned URL for comment attachment');
    }

    const uploadResult = await this.apiHelperService.getImageEtag(
      presignedResponse.presignedUrl,
      file.file
    );

    if (!uploadResult) {
      throw new Error('Failed to upload comment attachment');
    }

    let eTag = '';
    if (typeof uploadResult === 'string') {
      eTag = uploadResult;
    } else if (uploadResult.headers) {
      eTag = uploadResult.headers.get('etag') || uploadResult.headers.get('ETag') || '';
    }

    return {
      fileKey: presignedResponse.fileKey,
      eTag: eTag,
      fileName: file.name,
      fileSize: file.size
    };
  }

  async onCommentInput(event: any): Promise<void> {
    const value = event.target.value;
    this.newCommentText = value;

    const cursorPos = event.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      const query = atMatch[1];
      if (query.length > 0) {
        try {
          const users = await this.apiHelperService.searchUsers(query);
          this.mentionResults = users.map((user: any) => ({
            id: user.applicationUserId || user.id,
            name: user.firstName + ' ' + (user.lastName || ''),
            displayName: user.displayName || user.firstName,
            email: user.email
          }));
          this.showMentionList = this.mentionResults.length > 0;
          this.cdr.markForCheck();
        } catch (error) {
          console.error('Failed to search users for mentions:', error);
          this.showMentionList = false;
        }
      }
    } else {
      this.showMentionList = false;
    }
  }

  selectMention(user: User): void {
    const textarea = document.querySelector('#commentTextarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const value = textarea.value;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);

    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, textBeforeCursor.length - atMatch[0].length);
      const mentionText = `@${user.name} `;
      this.newCommentText = beforeAt + mentionText + textAfterCursor;

      setTimeout(() => {
        const newCursorPos = beforeAt.length + mentionText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }

    this.showMentionList = false;
    this.cdr.markForCheck();
  }

  private extractMentionedUserIds(): number[] {
    const mentionRegex = /@(\w+\s*\w*)/g;
    const matches = this.newCommentText.match(mentionRegex);
    const mentionedIds: number[] = [];

    if (matches) {
      matches.forEach(match => {
        const userName = match.substring(1).trim();
        const user = this.userList.find(u =>
          u.name.toLowerCase().includes(userName.toLowerCase()) ||
          u.displayName?.toLowerCase().includes(userName.toLowerCase())
        );
        if (user && !mentionedIds.includes(user.id)) {
          mentionedIds.push(user.id);
        }
      });
    }

    return mentionedIds;
  }

  private formatTimestamp(dateString: string): string {
    return moment(dateString).format('MMM DD, YYYY [at] h:mm A');
  }



  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }


  getAttachmentUrl(fileKey: string): string {
    return `/api/v1/file-service/download/${fileKey}`;
  }

  getFileName(path: string): string {
    return path.split('/').pop() || path;
  }


  private async initializeComponentData(): Promise<void> {
    const initPromises = [
      this.fetchDocuments(),
      this.getClarificationsList(),
      this.fetchUserList()
    ];

    await Promise.allSettled(initPromises);
  }

  private initializeRequestDeduplication(): void {
    this.requestSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => prev.key === curr.key),
        switchMap(({ key, observable }) => {
          if (this.activeRequests.has(key)) {
            return of(null);
          }

          this.activeRequests.add(key);
          return observable.pipe(
            finalize(() => this.activeRequests.delete(key))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private createClarificationForm(clarification?: Clarification): FormGroup {
    const formConfig = {
      title: [
        clarification?.title || '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(200)]
      ],
      description: [
        clarification?.description || '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]
      ],
      assignedTo: [clarification?.assignedToId || '', Validators.required],
      attachments: [clarification?.attachments || []],
      dueDate: [clarification?.dueDate || '', [Validators.required, this.futureDateValidator]],
      filePurpose: [this.selectedFilePurpose, Validators.required],
      requestDocuments: [this.selectedRequestDocuments]
    };

    if (clarification && this.selectedClarificationId) {
      (formConfig as any).comments = [clarification.comments || ''];
    }

    return this.fb.group(formConfig);
  }

  private futureDateValidator = (control: any) => {
    if (control.value) {
      const selectedDate = moment(control.value);
      const today = moment().startOf('day');

      if (selectedDate.isBefore(today)) {
        return { pastDate: { value: control.value } };
      }
    }
    return null;
  };

  async getClarificationsList(): Promise<void> {
    const requestKey = `clarifications_${this.dsrFormId}`;

    if (this.activeRequests.has(requestKey)) {
      return;
    }

    this.clarificationsLoading.set(true);

    try {
      const params = { page: 1, size: 50 };
      const response = await this.apiHelperService.getClarificationsList(this.dsrFormId, params);

      const taskList = response?.taskList || response?.data?.taskList || response || [];
      this.clarifications = Array.isArray(taskList)
        ? taskList.map(this.mapClarificationFromApi.bind(this))
        : [];

    } catch (error) {
      console.error('Error fetching clarifications:', error);
      this.clarifications = [];
    } finally {
      this.clarificationsLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  private mapClarificationFromApi(item: any): Clarification {
    return {
      id: item.clarificationId || item.id,
      title: item.title || '',
      description: item.description || '',
      assignedTo: this.getUserDisplayName(item.assignedTo) || 'Unassigned',
      assignedToId: item.assignedTo,
      attachments: item.attachments || [],
      resolved: ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(item.state),
      comments: item.comments || '',
      dueDate: item.dueDate ? moment(item.dueDate).format('YYYY-MM-DD') : '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      status: item.status || 'OPEN'
    };
  }

  async fetchUserList(): Promise<void> {
    try {
      const response = await this.userService.getAdminUserMasterList()

      if (response && Array.isArray(response)) {
        this.userList = response.map(user => ({
          id: user.applicationUserId,
          name: user.displayName || user.firstName || 'Unknown User',
          displayName: user.displayName,
          email: user.email
        }));
      } else {
        this.userList = [];
      }
    } catch (error) {
      console.error('Error fetching user list:', error);
      this.userList = [];
    }
    console.log(this.userList)
  }

  async fetchDocuments(): Promise<void> {
    this.documentsList = [
      'Privacy Policy v2.1.pdf',
      'Data Processing Agreement.docx',
      'User Consent Forms.pdf',
      'Deletion Request Template.docx',
      'Compliance Guidelines.pdf',
      'Legal Framework Overview.pdf'
    ];
  }

  newClarification(): void {
    this.showClarificationDetails = false
    this.resetClarificationState();
    this.clarificationForm = this.createClarificationForm();
    this.cdr.markForCheck();
  }

  private updateSelectedFiles(attachments: string[]): void {
    this.selectedFiles = [];

    if (attachments && attachments.length > 0) {
      this.selectedFiles = attachments.map(fileName => ({
        file: new File([], fileName),
        name: fileName,
        size: 0,
        type: 'application/octet-stream',
        id: this.generateFileId()
      }));
    }
  }

  async submitClarification(): Promise<void> {
    const requestKey = `submit_clarification_${this.dsrFormId}_${Date.now()}`;

    if (this.activeRequests.has(requestKey) || this.submitLoading()) {
      return;
    }

    if (this.clarificationForm.invalid) {
      this.clarificationForm.markAllAsTouched();
      this.showValidationErrors();
      return;
    }

    this.submitLoading.set(true);
    this.activeRequests.add(requestKey);

    try {
      await this.processClarificationSubmission();
    } catch (error) {
      console.error('Error during clarification submission:', error);
      this.showErrorMessage(error as Error);
    } finally {
      this.submitLoading.set(false);
      this.activeRequests.delete(requestKey);
      this.cdr.markForCheck();
    }
  }

  private async processClarificationSubmission(): Promise<void> {
    const formData = this.clarificationForm.value;
    const isUpdate = this.selectedClarificationId !== null;
    let attachmentKeys: string[] = [];

    if (this.selectedFiles.length > 0) {
      attachmentKeys = await this.uploadAttachmentsSequentially(this.selectedFiles);
    }

    this.validateRequiredFields(formData);

    const payload = this.buildClarificationPayload(formData, attachmentKeys);

    let result;
    let clarificationId: number;

    if (isUpdate) {
      result = await this.updateClarificationApi(this.selectedClarificationId!, payload);
      clarificationId = this.selectedClarificationId!;
      await this.handleUpdateComment(clarificationId, formData.comments);
    } else {
      result = await this.createClarificationApi(payload);
      clarificationId = this.extractClarificationId(result) ?? 0;
    }

    await this.handlePostSubmissionActions(clarificationId, isUpdate);
  }

  private buildClarificationPayload(formData: any, attachmentKeys: string[]) {
    const payload: any = {
      title: formData.title,
      description: formData.description,
      dueDate: moment(formData.dueDate).format('YYYY-MM-DDTHH:mm:ss'),
      assignedTo: parseInt(formData.assignedTo),
      parentId: 0,
      attachments: attachmentKeys
    };

    if (this.selectedRequestDocuments && this.selectedRequestDocuments.length > 0) {
      payload.documents = this.selectedRequestDocuments;
    }

    return payload;
  }

  private validateRequiredFields(formData: any): void {
    const requiredFields = ['title', 'description', 'assignedTo', 'dueDate'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  private async handleUpdateComment(clarificationId: number, commentContent: string): Promise<void> {
    const trimmedContent = commentContent?.trim();
    if (trimmedContent && trimmedContent.length > 0) {
    }
  }

  private async handlePostSubmissionActions(clarificationId: number, isUpdate: boolean): Promise<void> {
    await this.getClarificationsList();
    this.showSuccessMessage(isUpdate ? 'updated' : 'created');

    if (clarificationId) {
      const targetClarification = this.clarifications.find(c => c.id === clarificationId);
      if (targetClarification) {
        setTimeout(() => this.selectClarification(targetClarification), 1000);
      }
    }

    if (!isUpdate) {
      setTimeout(() => this.resetFormForNewEntry(), 1500);
    }
  }

  private async uploadAttachmentsSequentially(files: SelectedFile[]): Promise<string[]> {
    const uploadedFileKeys: string[] = [];
    const selectedPurpose = this.clarificationForm.get('filePurpose')?.value || DSR_ATTACHMENT;

    for (const selectedFile of files) {
      try {
        const fileKey = await this.uploadSingleFile(selectedFile, selectedPurpose);
        uploadedFileKeys.push(fileKey);
      } catch (error) {
        console.error(`Failed to upload ${selectedFile.name}:`, error);
        throw new Error(`File upload failed for ${selectedFile.name}: ${error}`);
      }
    }

    return uploadedFileKeys;
  }

  private async uploadSingleFile(selectedFile: SelectedFile, purpose: string): Promise<string> {
    const uploadParams = {
      fileName: selectedFile.name,
      contentType: selectedFile.type,
      fileSize: selectedFile.size,
      purpose: purpose
    };

    const presignedResponse = await this.apiHelperService.uploadPresignedUrl(uploadParams);

    if (!presignedResponse?.presignedUrl) {
      throw new Error('Failed to get presigned URL from response');
    }

    this.updateFileProgress(selectedFile.id, 50);

    const uploadResult = await this.apiHelperService.getImageEtag(
      presignedResponse.presignedUrl,
      selectedFile.file
    );

    if (!uploadResult) {
      throw new Error('File upload to presigned URL failed');
    }

    this.updateFileProgress(selectedFile.id, 100);
    return presignedResponse.fileKey || selectedFile.name;
  }

  private updateFileProgress(fileId: string, progress: number): void {
    const progressMap = new Map(this.fileUploadProgress());
    progressMap.set(fileId, progress);
    this.fileUploadProgress.set(progressMap);
    this.cdr.markForCheck();
  }

  private async createClarificationApi(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.apiHelperService.createClarification(this.dsrFormId, data)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            reject(new Error(`API Error: ${error.message || 'Unknown error occurred'}`));
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response) {
              resolve(response);
            }
          },
          complete: () => subscription.unsubscribe()
        });
    });
  }

  private async updateClarificationApi(clarificationId: number, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const subscription = this.apiHelperService.updateClarification(this.dsrFormId, clarificationId, data)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            reject(new Error(`API Error: ${error.message || 'Unknown error occurred'}`));
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response) {
              resolve(response);
            }
          },
          complete: () => subscription.unsubscribe()
        });
    });
  }

  private extractClarificationId(response: any): number | null {
    const possibleIds = [
      response?.clarificationId,
      response?.id,
      response?.taskId,
      response?.data?.clarificationId,
      response?.data?.id,
      response?.data?.taskId
    ];

    for (const id of possibleIds) {
      if (id && (typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id))))) {
        return typeof id === 'number' ? id : parseInt(id);
      }
    }

    return null;
  }

  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private resetClarificationState(): void {
    this.selectedClarificationId = null;
    this.selectedFiles = [];
    this.fileUploadProgress.set(new Map());
    this.resetCommentForm();
    this.resetThreading();
  }

  private resetFormForNewEntry(): void {
    this.resetClarificationState();
    this.clarificationForm = this.createClarificationForm();
    this.cdr.markForCheck();
  }

  private handleInitializationError(error: any): void {
    console.error('Component initialization failed:', error);
  }

  private showValidationErrors(): void {
    const errors: string[] = [];

    const errorChecks = [
      { field: 'title', message: 'Title is required' },
      { field: 'description', message: 'Description is required' },
      { field: 'assignedTo', message: 'Assignee selection is required' },
      { field: 'dueDate', message: 'Due date is required' }
    ];

    errorChecks.forEach(({ field, message }) => {
      if (this.clarificationForm.get(field)?.hasError('required')) {
        errors.push(message);
      }
    });

    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
    }
  }

  private showSuccessMessage(action: 'created' | 'updated' | string): void {
    const message = typeof action === 'string' && action.includes('successfully')
      ? action
      : `Clarification ${action} successfully!`;

    this.createNotification(message, '#4CAF50');
  }

  private showErrorMessage(error: Error): void {
    let userMessage = 'An error occurred while processing the clarification.';

    if (error.message.includes('File upload failed')) {
      userMessage = 'File upload failed. Please check your files and try again.';
    } else if (error.message.includes('Missing required fields')) {
      userMessage = 'Please fill in all required fields.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = 'Network error occurred. Please check your connection and try again.';
    }

    alert(userMessage);
  }

  private createNotification(message: string, backgroundColor: string): void {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed; top: 20px; right: 20px; background-color: ${backgroundColor}; color: white;
        padding: 12px 24px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000; font-family: 'Source Sans 3', sans-serif; font-size: 14px;
        animation: slideIn 0.3s ease-out;">
        ${message}
      </div>`;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  formatDueDate(dateString: string): string {
    return moment(dateString).format('MMM DD, YYYY');
  }

  isClarificationOverdue(clarification: Clarification): boolean {
    return !clarification.resolved && moment(clarification.dueDate).isBefore(moment(), 'day');
  }

  getClarificationPriorityIndicator(clarification: Clarification): string {
    switch (clarification.status) {
      case 'OPEN':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-red-500';
      case 'CLOSED':
        return 'bg-green-500';
      case 'IN_PROGRESS':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  }

  getFileUploadProgress(fileId: string): number {
    return this.fileUploadProgress().get(fileId) || 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word')) return 'description';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'table_chart';
    return 'attachment';
  }

  trackClarificationById(index: number, clarification: Clarification): number {
    return clarification.id;
  }

  get shouldShowInitialCommentField(): boolean {
    return this.selectedClarificationId !== null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = Array.from(event.dataTransfer?.files || []);
    this.processSelectedFiles(files);
  }

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    this.processSelectedFiles(files);

    if (target) {
      target.value = '';
    }
  }

  openFileExplorer(): void {
    this.fileInput?.nativeElement?.click();
  }

  private processSelectedFiles(files: File[]): void {
    const validFiles: SelectedFile[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        const selectedFile: SelectedFile = {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          id: this.generateFileId()
        };

        const existingFile = this.selectedFiles.find(f => f.name === file.name && f.size === file.size);
        if (!existingFile) {
          validFiles.push(selectedFile);
        } else {
          errors.push(`File "${file.name}" is already selected`);
        }
      } else {
        errors.push(...validation.errors);
      }
    });

    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    const fileNames = this.selectedFiles.map(f => f.name);
    this.clarificationForm.patchValue({ attachments: fileNames });

    if (errors.length > 0) {
      console.warn('File selection errors:', errors);
    }
  }

  private validateFile(file: File): FileValidationResult {
    const errors: string[] = [];

    if (file.size > this.maxFileSize) {
      errors.push(`File "${file.name}" exceeds maximum size of ${this.formatFileSize(this.maxFileSize)}`);
    }

    if (!this.allowedFileTypes.includes(file.type)) {
      errors.push(`File type "${file.type}" is not allowed for "${file.name}"`);
    }

    if (file.name.length > 255) {
      errors.push(`File name "${file.name}" is too long`);
    }

    return { isValid: errors.length === 0, errors };
  }

  removeSelectedFile(fileId: string): void {
    this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
    const fileNames = this.selectedFiles.map(f => f.name);
    this.clarificationForm.patchValue({ attachments: fileNames });
  }

  clearAllSelectedFiles(): void {
    this.selectedFiles = [];
    this.clarificationForm.patchValue({ attachments: [] });
  }

  isChecked(doc: string): boolean {
    const attachments = this.clarificationForm.get('attachments')?.value || [];
    return attachments.includes(doc);
  }

  toggleDocument(doc: string): void {
    const attachments = this.clarificationForm.get('attachments')?.value || [];
    const index = attachments.indexOf(doc);

    if (index >= 0) {
      attachments.splice(index, 1);
    } else {
      attachments.push(doc);
    }

    this.clarificationForm.patchValue({ attachments });
  }

  getSelectedDocuments(): string[] {
    return this.selectedFiles.map(f => f.name);
  }

  toggleDocumentSelector(): void {
    this.showDocumentSelector.set(!this.showDocumentSelector());
  }

  getPurposeDescription(purpose: string): string {
    const option = this.filePurposeOptions.find(opt => opt.value === purpose);
    return option?.description || '';
  }

  onFilePurposeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      this.selectedFilePurpose = target.value;
      this.clarificationForm.patchValue({ filePurpose: target.value });
    }
  }

  async deleteClarification(clarificationId: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this clarification?')) {
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        const subscription = this.apiHelperService.deleteClarification(this.dsrFormId, clarificationId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: resolve,
            error: reject,
            complete: () => subscription.unsubscribe()
          });
      });

      await this.getClarificationsList();

      if (this.selectedClarificationId === clarificationId) {
        this.resetForm();
      }

      this.showSuccessMessage('Clarification deleted successfully!');
    } catch (error) {
      console.error('Error deleting clarification:', error);
      this.showErrorMessage(error as Error);
    }
  }

  completeStage(): void {
    const incompleteClarifications = this.clarifications.filter(clarification => !clarification.resolved);

    if (incompleteClarifications.length > 0) {
      const message = `You have ${incompleteClarifications.length} incomplete clarification${incompleteClarifications.length > 1 ? 's' : ''}. Please complete them before finishing this stage.`;
      alert(message);
      return;
    }

    this.submitLoading.set(true);

    of(null).pipe(
      delay(2000),
      finalize(() => this.submitLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.dialogRef.close({ stageCompleted: true });
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  closeDialogAfterCreation(): void {
    this.dialogRef.close({
      clarificationCreated: true,
      totalClarifications: this.clarifications.length
    });
  }

  resetForm(): void {
    this.resetClarificationState();
    this.clarificationForm = this.createClarificationForm();
    this.showDocumentSelector.set(false);
    this.cdr.markForCheck();
  }

  get selectedClarification(): Clarification | undefined {
    return this.clarifications.find(c => c.id === this.selectedClarificationId);
  }

  private async processResolution(): Promise<void> {
    return new Promise((resolve, reject) => {
      const noteToSend = this.resolutionNote?.trim() || '';

      const subscription = this.apiHelperService.resolveDsrClarification(
        this.dsrFormId,
        this.selectedClarificationId!,
        noteToSend
      )
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Resolution API call failed:', error);
            const errorMessage = error.message || 'Failed to resolve clarification';
            reject(new Error(`Resolution failed: ${errorMessage}`));
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response) {
              resolve(response);
            } else {
              reject(new Error('No response received from resolution API'));
            }
          },
          error: (error) => {
            console.error('Subscription error during resolution:', error);
            reject(error);
          },
          complete: () => {
            subscription.unsubscribe();
          }
        });
    });
  }

  async resolveClarification(): Promise<void> {
    const requestKey = `resolve_clarification_${this.selectedClarificationId}_${Date.now()}`;

    if (this.activeRequests.has(requestKey) || this.resolveLoading()) {
      return;
    }

    if (!this.selectedClarificationId) {
      this.showErrorMessage(new Error('No clarification selected for resolution'));
      return;
    }

    const confirmMessage = this.resolutionNote
      ? `Are you sure you want to resolve this clarification with the note: "${this.resolutionNote}"?`
      : 'Are you sure you want to resolve this clarification?';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.resolveLoading.set(true);
    this.activeRequests.add(requestKey);

    try {
      await this.processResolution();
      await this.handlePostResolutionActions();
    } catch (error) {
      console.error('Error resolving clarification:', error);
      this.showErrorMessage(error as Error);
    } finally {
      this.resolveLoading.set(false);
      this.activeRequests.delete(requestKey);
      this.cdr.markForCheck();
    }
  }

  private async handlePostResolutionActions(): Promise<void> {
    const clarificationIndex = this.clarifications.findIndex(
      c => c.id === this.selectedClarificationId
    );

    if (clarificationIndex !== -1) {
      this.clarifications[clarificationIndex] = {
        ...this.clarifications[clarificationIndex],
        resolved: true
      };
    }

    await this.getClarificationsList();
    this.showSuccessMessage('Clarification resolved successfully');
    this.resolutionNote = '';

    setTimeout(() => {
      this.resetClarificationState();
      this.clarificationForm = this.createClarificationForm();
      this.cdr.markForCheck();
    }, 1500);
  }

  toggleResolutionDialog(): void {
    this.showResolutionDialog.set(!this.showResolutionDialog());
    if (!this.showResolutionDialog()) {
      this.resolutionNote = '';
    }
  }

  get canResolveClarification(): boolean {
    if (!this.selectedClarificationId) {
      return false;
    }

    const selectedClarification = this.clarifications.find(
      c => c.id === this.selectedClarificationId
    );

    return selectedClarification ? !selectedClarification.resolved : false;
  }

  get shouldShowRequestDocuments(): boolean {
    if (!this.selectedClarificationId) {
      return true;
    }

    const selectedClarification = this.clarifications.find(
      c => c.id === this.selectedClarificationId
    );

    return selectedClarification?.status === 'OPEN';
  }

  get hasRequestAttachments(): boolean {
    return this.dsrRequestAttachments && this.dsrRequestAttachments.length > 0;
  }

  isRequestDocumentSelected(documentUrl: string): boolean {
    return this.selectedRequestDocuments.includes(documentUrl);
  }

  async completeClarificationWithDocuments(): Promise<void> {
    const requestKey = `complete_clarification_${this.selectedClarificationId}_${Date.now()}`;

    if (this.activeRequests.has(requestKey) || this.completeLoading()) {
      return;
    }

    if (!this.selectedClarificationId) {
      this.showErrorMessage(new Error('No clarification selected for completion'));
      return;
    }

    const documentsToSend = this.selectedRequestDocuments.length > 0
      ? this.selectedRequestDocuments
      : [];

    const confirmMessage = documentsToSend.length > 0
      ? `Are you sure you want to complete this clarification with ${documentsToSend.length} selected document${documentsToSend.length !== 1 ? 's' : ''}?`
      : 'Are you sure you want to complete this clarification?';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.completeLoading.set(true);
    this.activeRequests.add(requestKey);

    try {
      await this.processCompleteClarification(documentsToSend);
      await this.handlePostCompletionActions();
    } catch (error) {
      console.error('Error completing clarification:', error);
      this.showErrorMessage(error as Error);
    } finally {
      this.completeLoading.set(false);
      this.activeRequests.delete(requestKey);
      this.cdr.markForCheck();
    }
  }

  private async processCompleteClarification(documents: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const subscription = this.apiHelperService.completeClarificationWithDocuments(
        this.selectedClarificationId!,
        documents
      )
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Completion API call failed:', error);
            const errorMessage = error.message || 'Failed to complete clarification';
            reject(new Error(`Completion failed: ${errorMessage}`));
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response !== null && response !== undefined) {
              resolve(response);
            } else {
              resolve();
            }
          },
          error: (error) => {
            console.error('Subscription error during completion:', error);
            reject(error);
          },
          complete: () => {
            subscription.unsubscribe();
          }
        });
    });
  }

  private async handlePostCompletionActions(): Promise<void> {
    const clarificationIndex = this.clarifications.findIndex(
      c => c.id === this.selectedClarificationId
    );

    if (clarificationIndex !== -1) {
      this.clarifications[clarificationIndex] = {
        ...this.clarifications[clarificationIndex],
        resolved: true
      };
    }
    await this.getClarificationsList();
    this.showSuccessMessage('Clarification completed successfully with selected documents');

    this.selectedRequestDocuments = [];
    this.clarificationForm.patchValue({ requestDocuments: [] });

    setTimeout(() => {
      this.resetClarificationState();
      this.clarificationForm = this.createClarificationForm();
      this.cdr.markForCheck();
    }, 1500);
  }

  async resolveCompletedClarification(): Promise<void> {
    const requestKey = `resolve_completed_clarification_${this.selectedClarificationId}_${Date.now()}`;

    if (this.activeRequests.has(requestKey) || this.resolveClarificationLoading()) {
      return;
    }

    if (!this.selectedClarificationId) {
      this.showErrorMessage(new Error('No clarification selected for resolution'));
      return;
    }

    const resolutionNote = prompt('Please enter a resolution note (optional):') || '';

    const confirmMessage = resolutionNote
      ? `Are you sure you want to resolve this completed clarification with the note: "${resolutionNote}"?`
      : 'Are you sure you want to resolve this completed clarification?';

    if (!confirm(confirmMessage)) {
      return;
    }

    this.resolveClarificationLoading.set(true);
    this.activeRequests.add(requestKey);

    try {
      await this.processResolveCompletedClarification(resolutionNote);
      await this.handlePostCompletedResolutionActions();
    } catch (error) {
      console.error('Error resolving completed clarification:', error);
      this.showErrorMessage(error as Error);
    } finally {
      this.resolveClarificationLoading.set(false);
      this.activeRequests.delete(requestKey);
      this.cdr.markForCheck();
    }
  }

  private async processResolveCompletedClarification(resolutionNote: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const subscription = this.apiHelperService.resolveDsrClarification(
        this.dsrFormId,
        this.selectedClarificationId!,
        resolutionNote
      )
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Resolution API call failed:', error);
            const errorMessage = error.message || 'Failed to resolve clarification';
            reject(new Error(`Resolution failed: ${errorMessage}`));
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            resolve(response);
          },
          error: (error) => {
            console.error('Subscription error during resolution:', error);
            reject(error);
          },
          complete: () => {
            subscription.unsubscribe();
          }
        });
    });
  }

  private async handlePostCompletedResolutionActions(): Promise<void> {
    const clarificationIndex = this.clarifications.findIndex(
      c => c.id === this.selectedClarificationId
    );

    if (clarificationIndex !== -1) {
      this.clarifications[clarificationIndex] = {
        ...this.clarifications[clarificationIndex],
        resolved: true
      };
    }

    await this.getClarificationsList();
    this.showSuccessMessage('Completed clarification resolved successfully');

    setTimeout(() => {
      this.resetClarificationState();
      this.clarificationForm = this.createClarificationForm();
      this.cdr.markForCheck();
    }, 1500);
  }

  get canCompleteClarification(): boolean {
    if (!this.selectedClarificationId) {
      return false;
    }

    const selectedClarification = this.clarifications.find(
      c => c.id === this.selectedClarificationId
    );

    if (!selectedClarification) {
      return false;
    }

    if (selectedClarification.status === 'CLOSED' || selectedClarification.status === 'COMPLETED') {
      return false;
    }
    return !selectedClarification.resolved;
  }

  get shouldShowDocumentSelection(): boolean {
    if (!this.selectedClarificationId) {
      return false;
    }

    const selectedClarification = this.clarifications.find(
      c => c.id === this.selectedClarificationId
    );

    if (!selectedClarification) {
      return false;
    }

    if (selectedClarification.status === 'COMPLETED' || selectedClarification.status === 'CLOSED') {
      return false;
    }

    return true;
  }

  get canResolveCompletedClarification(): boolean {
    if (!this.selectedClarificationId) {
      return false;
    }

    const selectedClarification = this.clarifications.find(
      c => c.id === this.selectedClarificationId
    );

    if (!selectedClarification) {
      return false;
    }

    if (selectedClarification.status === 'CLOSED') {
      return false;
    }
    return selectedClarification.status === 'COMPLETED' && !selectedClarification.resolved;
  }

  toggleRequestDocument(fileName: string): void {
    const index = this.selectedRequestDocuments.indexOf(fileName);

    if (index >= 0) {
      this.selectedRequestDocuments.splice(index, 1);
    } else {
      this.selectedRequestDocuments.push(fileName);
    }

    this.clarificationForm.patchValue({ requestDocuments: this.selectedRequestDocuments });
    this.cdr.markForCheck();
  }

  clearAllRequestDocuments(): void {
    this.selectedRequestDocuments = [];
    this.clarificationForm.patchValue({ requestDocuments: [] });
    this.cdr.markForCheck();
  }

  getSelectedRequestDocumentsCount(): number {
    return this.selectedRequestDocuments.length;
  }

  getRequestDocumentIcon(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table_chart';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'image';
      case 'txt':
        return 'text_snippet';
      default:
        return 'attachment';
    }
  }

  onCancelForm() {
    this.showClarificationDetails = false
  }
}
