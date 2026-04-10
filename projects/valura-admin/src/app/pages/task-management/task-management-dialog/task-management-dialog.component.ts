import { Component, ElementRef, inject, Inject, ViewChild, OnDestroy, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { Subject, firstValueFrom } from 'rxjs';
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatTabChangeEvent, MatTabsModule } from "@angular/material/tabs";
import { QuillEditorComponent } from "ngx-quill";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { HEADER_ACTION, HEADER_EXCEMPTED, TASK_MANAGEMENT_RECORD_HEADER, TaskDialogTypes } from '../constant';
import { HttpService } from '@valura-lib/service/network/http.service';
import { ETAG } from '@admin-core/constants/api-constants';
import { FileDropDirective } from '@valura-lib/directives/file-drop/file-drop.directive';
import { CommentRecord, CommentThreadingService } from '../../request-management/comment-threading-service.service';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DSR_ATTACHMENT } from '@admin-core/constants/constants';
import { TaskManagementService } from '@admin-core/services/task-management/task-management.service';
import { RequestDataFulfillmentRecords } from '@admin-core/models/request-management/DsrRequest';


type ExemptedStatus = 'Exempted' | 'Not Exempted' | 'Pending';
type TabId = 'details' | 'documents' | 'comments';
type SortDirection = 'asc' | 'desc';
type TabCommentId = 'comments' | 'attachments';

const EXEMPTED_STATUS_CLASSES = {
  'Exempted': 'text-[#00AA44]',
  'Not Exempted': 'text-[#FF6B6B]',
  'Pending': 'text-[#FFA500]'
} as const;

const TAB_LOADING_DURATIONS = {
  'comments': 800,
  'details': 600,
  'documents': 500
} as const;


const MAX_COMMENTS_LIMIT = 100;

export interface TabConfig {
  readonly id: TabId;
  readonly label: string;
}

export interface TaskManagementDialogData {
  dialogTitle?: string;
  dataRecords?: RequestDataFulfillmentRecords[];
  comments?: CommentRecord[];
}

interface FormData {
  category: string;
  purpose: string;
  foundIn: string;
  exemption: boolean;
  justification: string;
}


@Component({
  selector: 'app-task-management-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatSortModule, MatMenu, MatMenuItem, MatMenuTrigger, FileDropDirective,
    LoadingButtonComponent, QuillEditorComponent, ScrollingModule, MatTabsModule, TextFieldModule],
  templateUrl: './task-management-dialog.component.html',
  styleUrls: ['./task-management-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskManagementDialogComponent implements AfterViewInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();
  private readonly snackbarService = inject(SnackbarService);
  private readonly threadingService = inject(CommentThreadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private httpService = inject(HttpService);
  @ViewChild('threadingCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('quillEditorRef', { static: false }) quillEditorComponent: any;

  readonly submitLoading = signal(false);
  readonly activeTab = signal<TabId>('details');
  readonly activeCommentTab = signal<TabCommentId>('comments');
  showAddRecordForm: boolean = false;

  readonly isTabLoading = signal(false);
  private readonly threadingRetryAttempts = signal(0);
  private readonly maxRetryAttempts = 3;
  private threadingInitialized = false;
  private lastScrollPosition = 0;
  private scrollMonitoringActive = false;
  private apiHelperService = inject(ApiHelperService);
  private taskManagementService = inject(TaskManagementService);

  TaskDialogTypes = TaskDialogTypes
  tabs: TabConfig[] = [];
  rightPanelTabs: { id: string; label: string }[] = [
    { id: 'comments', label: 'Comments' },
    { id: 'attachments', label: 'Attachments' }
  ];
  newCommentText = '';
  preventMentionReopen = false;
  mentionStartIndex: any
  dialogTitle = '';
  totalRecordsCount = 0;
  currentSortColumn = '';
  isSaveLoading = false;
  isEditMode = false;
  uploadedFiles: any[] = [];
  editingRecordId: number | null = null;
  dataFullFillmentRecordsData = new MatTableDataSource<any>();
  editingCommentId: number | null = null;
  parentIdForReply: any;
  commentsData: CommentRecord[] = [];
  mentionResults: any[] = [];
  showMentionList = false;
  mentionMap: { name: string, id: number }[] = [];
  addRecordForm: FormGroup = this.createAddRecordForm();
  isTask = false;
  isClarification = false;
  selectedRequestLeftIndex: number = 0;
  headers = TASK_MANAGEMENT_RECORD_HEADER;
  displayedColumns = this.headers.map(h => h.columnDef);
  sortDirection: 'asc' | 'desc' = 'asc';
  HEADER_EXCEMPTED = HEADER_EXCEMPTED
  HEADER_ACTION = HEADER_ACTION
  positiveButtonLabel: string = '';

  constructor(
    public readonly dialogRef: MatDialogRef<TaskManagementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { dsrDetails: any; documents: string[], title: string, taskId: number, clarificationId: number, viewType: string, description: string }
  ) {
    this.setTabsForViewType()
  }

  ngAfterViewInit(): void {
    this.initializeThreadingSystem();
    this.attachEventListeners();
  }

  ngOnInit(): void {
    if (this.data.viewType == TaskDialogTypes.TASK) {
      this.fetchDataFulfillmentRecords();

    }
    if (this.data.viewType == TaskDialogTypes.CLARIFICATION) {
      if (!this.taskManagementService.clarificationCompleted(this.data.dsrDetails.status)) {
        this.positiveButtonLabel = "Complete Stage"
      }
      this.fetchComments();
    }

  }

  ngOnDestroy(): void {
    this.cleanupResources();
  }

  private setTabsForViewType() {
    if (this.data.viewType === TaskDialogTypes.TASK) {
      this.tabs = [
        { id: 'details', label: 'Details' },
        { id: 'documents', label: 'Documents' },
        { id: 'comments', label: 'Comments' }
      ];
    } else if (this.data.viewType === TaskDialogTypes.CLARIFICATION) {
      this.tabs = [
        { id: 'details', label: 'Details' },
        { id: 'documents', label: 'Documents' },
      ];
    }
  }

  private createAddRecordForm(): FormGroup {
    return this.fb.group({
      attributeName: ['', [Validators.required]],
      category: ['', [Validators.required]],
      purpose: ['', [Validators.required]],
      foundIn: ['', [Validators.required]],
      exemption: ['', [Validators.required]],
      justification: ['', [Validators.required]]
    });
  }

  private async initializeThreadingSystem(): Promise<void> {
    if (this.threadingInitialized) {
      return;
    }

    try {
      await this.ensureDOMStability();

      if (!this.canvasRef?.nativeElement) {
        throw new Error('Canvas element not available for threading system');
      }

      const initialized = this.threadingService.initializeCanvas(this.canvasRef.nativeElement);

      if (!initialized) {
        throw new Error('Failed to initialize threading canvas');
      }

      this.threadingInitialized = true;
      this.activateScrollMonitoring();

      if (this.shouldInitiateDrawing()) {
        await this.scheduleThreadDrawing();
      }

    } catch (error) {
      console.error('Threading system initialization failed:', error);
      await this.handleThreadingInitializationFailure();
    }
  }

  private activateScrollMonitoring(): void {
    if (this.scrollMonitoringActive) {
      return;
    }

    this.scrollMonitoringActive = true;

    const scrollContainer = this.findCommentsScrollContainer();
    if (scrollContainer) {
      const scrollHandler = () => {
        const currentScrollPosition = scrollContainer.scrollTop;
        if (Math.abs(currentScrollPosition - this.lastScrollPosition) > 1) {
          this.lastScrollPosition = currentScrollPosition;
        }
      };

      scrollContainer.addEventListener('scroll', scrollHandler, { passive: true });
      (this.threadingService as any).componentScrollHandler = scrollHandler;
      (this.threadingService as any).componentScrollContainer = scrollContainer;
    }
  }

  private findCommentsScrollContainer(): HTMLElement | null {
    const commentsContainer = document.querySelector('.w-full.h-full.overflow-y-auto');
    return commentsContainer as HTMLElement;
  }

  private async ensureDOMStability(): Promise<void> {
    return new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => resolve(), 10);
        });
      });
    });
  }

  private async ensureDOMElementsStable(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 10;

      const checkElements = () => {
        attempts++;

        if (this.threadingService.areCommentElementsReady(this.commentsData)) {
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('DOM elements not stable after maximum attempts'));
          return;
        }

        requestAnimationFrame(checkElements);
      };

      checkElements();
    });
  }

  private shouldInitiateDrawing(): boolean {
    return !this.isTabLoading() &&
      this.activeTab() === 'comments' &&
      this.commentsData.length > 0;
  }

  private async handleThreadingInitializationFailure(): Promise<void> {
    const currentAttempts = this.threadingRetryAttempts();

    if (currentAttempts < this.maxRetryAttempts) {
      this.threadingRetryAttempts.set(currentAttempts + 1);
      const retryDelay = Math.pow(2, currentAttempts) * 100;

      setTimeout(() => {
        this.initializeThreadingSystem();
      }, retryDelay);
    } else {
      console.error('Threading system initialization failed after maximum retry attempts');
      // this.snackbarService.openSnack('Comment threading display may be limited');
    }
  }

  private async scheduleThreadDrawing(): Promise<void> {
    if (!this.validateThreadingPreconditions()) {
      console.debug('Threading preconditions not met, skipping draw');
      return;
    }

    try {
      await this.ensureDOMElementsStable();
      await this.waitForCommentElementsReady();
      await this.ensureScrollStability();
      this.executeThreadDrawing();
    } catch (error) {
      console.error('Thread drawing failed:', error);
      await this.retryThreadDrawing();
    }
  }

  private async ensureScrollStability(): Promise<void> {
    return new Promise<void>(resolve => {
      const scrollContainer = this.findCommentsScrollContainer();
      if (!scrollContainer) {
        resolve();
        return;
      }

      let lastScrollTop = scrollContainer.scrollTop;
      let stabilityCheckCount = 0;
      const maxStabilityChecks = 5;

      const checkStability = () => {
        const currentScrollTop = scrollContainer.scrollTop;

        if (Math.abs(currentScrollTop - lastScrollTop) < 1) {
          stabilityCheckCount++;
          if (stabilityCheckCount >= maxStabilityChecks) {
            resolve();
            return;
          }
        } else {
          stabilityCheckCount = 0;
          lastScrollTop = currentScrollTop;
        }

        requestAnimationFrame(checkStability);
      };
      requestAnimationFrame(checkStability);
      setTimeout(() => resolve(), 200);
    });
  }

  private validateThreadingPreconditions(): boolean {
    return this.threadingInitialized &&
      this.threadingService.isReady() &&
      !this.isTabLoading() &&
      this.activeTab() === 'comments';
  }

  private async waitForCommentElementsReady(timeout = 3000): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkElements = () => {
        if (this.threadingService.areCommentElementsReady(this.commentsData)) {
          resolve();
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error('Comment elements not ready within timeout period'));
          return;
        }

        requestAnimationFrame(checkElements);
      };

      checkElements();
    });
  }

  private executeThreadDrawing(): void {
    try {
      const validatedComments = this.validateCommentStructure(this.commentsData);
      this.threadingService.drawAllThreadingLines(validatedComments);
      const scrollMetrics = this.threadingService.getCurrentScrollMetrics();
      console.debug('Threading drawn with scroll metrics:', scrollMetrics);

    } catch (error) {
      console.error('Error during thread drawing execution:', error);
      throw error;
    }
  }

  private validateCommentStructure(comments: CommentRecord[]): CommentRecord[] {
    const validComments = comments.filter(comment => {
      if (!comment.id || !comment.author || typeof comment.isReply !== 'boolean') {
        console.warn('Invalid comment structure detected:', comment);
        return false;
      }
      if (comment.isReply) {
        if (!comment.parentId) {
          console.warn('Reply comment missing parentId:', comment);
          return false;
        }
        const parentExists = comments.some(c =>
          c.id === comment.parentId && !c.isReply
        );

        if (!parentExists) {
          console.warn('Reply comment has invalid parentId:', comment);
          return false;
        }
      }

      return true;
    });
    if (validComments.length !== comments.length) {
      console.warn(`Filtered ${comments.length - validComments.length} invalid comments`);
    }

    return validComments;
  }

  private async retryThreadDrawing(): Promise<void> {
    const currentAttempts = this.threadingRetryAttempts();

    if (currentAttempts < this.maxRetryAttempts) {
      this.threadingRetryAttempts.set(currentAttempts + 1);
      const retryDelay = 150 + (currentAttempts * 50);

      setTimeout(() => {
        this.scheduleThreadDrawing();
      }, retryDelay);
    }
  }

  setActiveTabWithShimmer(tab: TabId): void {
    if (this.activeTab() === tab) {
      return;
    }

    this.resetThreadingState();
    this.deactivateScrollMonitoring();
    this.activateShimmerLoading();
    this.activeTab.set(tab);
    this.cdr.detectChanges();

    const loadingDuration = this.getLoadingDurationForTab(tab);

    setTimeout(async () => {
      await this.deactivateShimmerLoading();
      this.handleTabPostLoadActions(tab);
    }, loadingDuration);
  }

  setActiveTab(event: MatTabChangeEvent): void {
    const tab = this.tabs[event.index].id
    this.setActiveTabWithShimmer(tab);
  }

  private resetThreadingState(): void {
    this.threadingRetryAttempts.set(0);
  }

  private deactivateScrollMonitoring(): void {
    this.scrollMonitoringActive = false;
    const service = this.threadingService as any;
    if (service.componentScrollHandler && service.componentScrollContainer) {
      service.componentScrollContainer.removeEventListener('scroll', service.componentScrollHandler);
      service.componentScrollHandler = undefined;
      service.componentScrollContainer = undefined;
    }
  }

  private activateShimmerLoading(): void {
    this.isTabLoading.set(true);
  }

  private async deactivateShimmerLoading(): Promise<void> {
    this.isTabLoading.set(false);
    this.cdr.detectChanges();

    return new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  private getLoadingDurationForTab(tab: TabId): number {
    return (TAB_LOADING_DURATIONS)[tab];
  }

  private handleTabPostLoadActions(tab: TabId): void {
    const tabActions: Record<TabId, () => void | Promise<void>> = {
      'comments': async () => {
        await this.fetchComments();               // fetch from API
        await this.reinitializeCommentThreading(); // then redraw threading lines
      },
      'details': () => this.triggerProgressAnimations(),
      'documents': () => this.initializeDocumentFeatures()
    };

    const action = tabActions[tab];
    if (action) {
      const result = action();
      if (result instanceof Promise) {
        result.catch(err => console.error('Tab action error:', err));
      }
    }
  }


  private async reinitializeCommentThreading(): Promise<void> {
    this.threadingInitialized = false;
    await this.waitForCanvasElement();
    await this.initializeThreadingSystem();
  }

  private async waitForCanvasElement(maxAttempts: number = 10): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let attempts = 0;

      const checkCanvas = () => {
        attempts++;

        if (this.canvasRef?.nativeElement) {
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          reject(new Error('Canvas element not available after maximum attempts'));
          return;
        }

        requestAnimationFrame(checkCanvas);
      };

      checkCanvas();
    });
  }

  private handleNullValues(valueA: unknown, valueB: unknown): number | null {
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return this.sortDirection === 'asc' ? -1 : 1;
    if (valueB == null) return this.sortDirection === 'asc' ? 1 : -1;
    return null;
  }

  private compareValues(valueA: unknown, valueB: unknown): number {
    const a = String(valueA);
    const b = String(valueB);
    return a > b ? 1 : a < b ? -1 : 0;
  }



  private createEnhancedReplyComment(originalComment: CommentRecord): CommentRecord {
    const parentId = originalComment.isReply ? originalComment.parentId : originalComment.id;

    return {
      id: this.generateUniqueCommentId(),
      author: 'Current User',
      timestamp: this.formatCurrentTimestamp(),
      avatar: 'CU',
      mention: `@${originalComment.author}`,
      content: 'New reply content - please edit this message',
      isReply: true,
      parentId: parentId,
      attachments: []

    };
  }

  private calculateOptimalInsertionIndex(targetComment: CommentRecord): number {
    const parentId = targetComment.isReply ? targetComment.parentId! : targetComment.id;
    const threadComments = this.commentsData.filter(comment =>
      comment.id === parentId || comment.parentId === parentId
    );

    if (threadComments.length === 0) {
      return this.commentsData.length;
    }
    const lastThreadCommentIndex = Math.max(
      ...threadComments.map(comment =>
        this.commentsData.findIndex(c => c.id === comment.id)
      )
    );

    return lastThreadCommentIndex + 1;
  }

  private formatCurrentTimestamp(): string {
    const now = new Date();
    return now.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  private determineDeletionStrategy(comment: CommentRecord): 'reply' | 'parent-cascade' | 'parent-preserve' {
    if (comment.isReply) {
      return 'reply';
    }

    const hasReplies = this.commentsData.some(c =>
      c.isReply && c.parentId === comment.id
    );

    return hasReplies ? 'parent-cascade' : 'parent-preserve';
  }

  private executeCommentDeletion(comment: CommentRecord, strategy: string): void {
    switch (strategy) {
      case 'reply':
        this.commentsData = this.commentsData.filter(c => c.id !== comment.id);
        break;

      case 'parent-cascade':
        this.commentsData = this.commentsData.filter(c =>
          c.id !== comment.id && c.parentId !== comment.id
        );
        break;

      case 'parent-preserve':
        this.commentsData = this.commentsData.filter(c => c.id !== comment.id);
        break;

      default:
        throw new Error(`Unknown deletion strategy: ${strategy}`);
    }
  }

  private createReplyComment(originalComment: CommentRecord): CommentRecord {
    return this.createEnhancedReplyComment(originalComment);
  }

  private removeComment(comment: CommentRecord): void {
    const strategy = this.determineDeletionStrategy(comment);
    this.executeCommentDeletion(comment, strategy);
  }

  private removeReplyComment(comment: CommentRecord): void {
    this.executeCommentDeletion(comment, 'reply');
  }

  private removeParentCommentAndReplies(comment: CommentRecord): void {
    this.executeCommentDeletion(comment, 'parent-cascade');
  }

  private validateCommentOperation(comment: CommentRecord): void {
    if (!comment) {
      throw new Error('Invalid comment provided');
    }
    if (this.commentsData.length >= MAX_COMMENTS_LIMIT) {
      throw new Error('Maximum comment limit reached');
    }
  }

  private handleCommentError(error: unknown, operation: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error ${operation}:`, errorMessage);

    const userMessage = errorMessage.includes('limit')
      ? errorMessage
      : 'Please try again.';

    this.snackbarService.openSnack(`Failed to ${operation}. ${userMessage}`);
  }

  private updateUIAfterCommentChange(): void {
    this.cdr.detectChanges();
    if (this.shouldInitiateDrawing()) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.scheduleThreadDrawing();
        }, 100);
      });
    }
  }

  addRecords(): void {
    this.isEditMode = false;
    this.editingRecordId = null;
    this.addRecordForm.reset();
    this.showAddRecordForm = true
    this.cdr.detectChanges();
  }

  cancelAddRecord(): void {
    this.showAddRecordForm = false
    this.resetAddRecordForm();
    this.cdr.detectChanges();
  }


  async saveAndContinue(): Promise<void> {
    if (this.addRecordForm.invalid) {
      this.snackbarService.openSnack('Please fill in all required fields');
      this.addRecordForm.markAllAsTouched();
      return;
    }

    this.isSaveLoading = true;
    const payload = this.addRecordForm.value;

    try {
      if (this.isEditMode && this.editingRecordId) {
        await firstValueFrom(
          this.apiHelperService.editRecord(
            this.data.dsrDetails.dsrFormId,
            this.data.taskId,
            this.editingRecordId,
            payload
          )
        );
        this.snackbarService.openSnack('Record updated successfully');
      } else {
        await firstValueFrom(
          this.apiHelperService.saveAddRecordDetails(
            payload,
            this.data.dsrDetails.dsrFormId,
            this.data.taskId
          )
        );
        this.snackbarService.openSnack('New record added successfully');
      }

      this.cancelAddRecord();
      await this.fetchDataFulfillmentRecords();
    } catch (error) {
      console.error('Error saving record:', error);
      this.snackbarService.openSnack('Failed to save record. Please try again.');
    } finally {
      this.isSaveLoading = false;
    }
  }
  approveRecord(record: RequestDataFulfillmentRecords): void {
    console.log('Approving record:', record);
    this.snackbarService.openSnack('Record approval functionality will be implemented');
  }

  private resetAddRecordForm(): void {
    this.addRecordForm.reset();
  }

  trackByCommentId(index: number, comment: CommentRecord): number {
    return comment.id;
  }

  getExemptedStatusClass(status: string): string {
    return EXEMPTED_STATUS_CLASSES[status as keyof typeof EXEMPTED_STATUS_CLASSES] || 'text-[#161D1D]';
  }

  triggerTabRefresh(tab?: TabId): void {
    const targetTab = tab || this.activeTab();
    this.setActiveTabWithShimmer(targetTab);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  refreshCommentThreads(): void {
    if (this.threadingInitialized && this.shouldInitiateDrawing()) {
      this.threadingService.forceRedraw(this.commentsData);
    }
  }

  getThreadingStatus(): {
    initialized: boolean;
    scrollMonitoring: boolean;
    scrollMetrics: any;
    activeConnections: number;
  } {
    return {
      initialized: this.threadingInitialized,
      scrollMonitoring: this.scrollMonitoringActive,
      scrollMetrics: this.threadingService.getCurrentScrollMetrics(),
      activeConnections: this.threadingService.getActiveConnections().length
    };
  }

  private generateUniqueCommentId(): number {
    return Math.max(...this.commentsData.map(c => c.id), 0) + 1;
  }

  private findThreadEndIndex(parentId: number): number {
    for (let i = 0; i < this.commentsData.length; i++) {
      const comment = this.commentsData[i];
      if (comment.id === parentId) {
        return this.findInsertionPoint(i, parentId);
      }
    }
    return this.commentsData.length;
  }

  private findInsertionPoint(startIndex: number, parentId: number): number {
    for (let j = startIndex + 1; j < this.commentsData.length; j++) {
      const nextComment = this.commentsData[j];
      if (!nextComment.isReply || nextComment.parentId !== parentId) {
        return j;
      }
    }
    return this.commentsData.length;
  }

  private triggerProgressAnimations(): void {
    const progressElements = document.querySelectorAll('.bg-blue-600');
    progressElements.forEach((element, index) => {
      if (element instanceof HTMLElement) {
        element.style.transition = `width ${300 + index * 100}ms ease-out`;
      }
    });
  }

  private initializeDocumentFeatures(): void {
    console.log('Document features initialized');
  }

  private attachEventListeners(): void {
    document.addEventListener('requestRedraw', this.handleRedrawRequest);
  }

  private handleRedrawRequest = (): void => {
    if (this.threadingInitialized && this.shouldInitiateDrawing()) {
      this.executeThreadDrawing();
    }
  };

  logThreadingDebugInfo(): void {
    if (this.threadingInitialized) {
      const status = this.getThreadingStatus();
      // console.group('Threading Debug Info');
      // console.log('Status:', status);
      // console.log('Comments Data:', this.commentsData);
      // console.log('Active Tab:', this.activeTab());
      // console.log('Tab Loading:', this.isTabLoading());
      // console.groupEnd();
    }
  }

  testScrollTracking(): void {
    const scrollContainer = this.findCommentsScrollContainer();
    if (scrollContainer) {
      console.log('Current scroll position:', scrollContainer.scrollTop);
      console.log('Threading scroll metrics:', this.threadingService.getCurrentScrollMetrics());
    }
  }

  private cleanupResources(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.deactivateScrollMonitoring();

    if (this.threadingService) {
      this.threadingService.destroy();
    }

    this.threadingInitialized = false;
    this.scrollMonitoringActive = false;
    document.removeEventListener('requestRedraw', this.handleRedrawRequest);
  }
  getFileName(path: string): string {
    return path.split('/').pop() || path;
  }

  downloadDocument(path: string) {
    const fileUrl = `https://valura-api.merc.org.in/api/v1/${path}`;
    window.open(fileUrl, '_blank');
  }


  async fetchDataFulfillmentRecords(): Promise<void> {
    this.isTabLoading.set(true);
    this.dataFullFillmentRecordsData = new MatTableDataSource<RequestDataFulfillmentRecords[]>;
    try {
      const res: any = await this.apiHelperService.getDataFulfillmentRecords(
        this.data.dsrDetails.dsrFormId,
        this.data.taskId
      );
      this.dataFullFillmentRecordsData = res.recordList
      this.totalRecordsCount = res.recordList.length;
    } catch (err) {
      // this.snackbarService.openSnack('Failed to load fulfillment records.');
    } finally {
      this.isTabLoading.set(false);
    }
  }

  onEditRecord(row: RequestDataFulfillmentRecords) {
    console.log(row, 'row');
    this.isEditMode = true;
    this.editingRecordId = row.id;

    this.addRecordForm.patchValue({
      attributeName: row.name,
      category: row.category,
      purpose: row.purpose,
      foundIn: row.foundIn,
      exemption: row.exempted,
      justification: row.justification
    });

    this.showAddRecordForm = true
  }


  onDeleteRecord(row: any) {
    this.apiHelperService.deleteRecord(this.data.dsrDetails.dsrFormId, this.data.taskId, row.recordId)
      .subscribe({
        next: () => this.fetchDataFulfillmentRecords(),
        error: (err) => console.error(err)
      });
  }


  onFileDropped(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      this.onFileChange(fileList[i]);
    }
  }

  onFileBrowse(event: any) {
    if (event.target.files && event.target.files.length) {
      for (let i = 0; i < event.target.files.length; i++) {
        this.onFileChange(event.target.files[i]);
      }
    }
  }

  onFileChange(file: File) {
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.snackbarService.openSnack(`File size exceeds 5MB`);
      return;
    }
    if (this.uploadedFiles.some(f => f.fileName === file.name)) {
      this.snackbarService.openSnack(`${file.name} already added`);
      return;
    }
    this.uploadPresignedUrl(file);
  }

  async uploadPresignedUrl(file: File) {
    const params = {
      fileName: file.name,
      contentType: file.type,
      purpose: DSR_ATTACHMENT
    };

    try {
      const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
      if (imageInfo) {
        const attachmentData = { ...imageInfo, file: file, fileName: file.name };
        this.uploadedFiles = [...this.uploadedFiles, attachmentData];
        this.snackbarService.openSnack(`${file.name} uploaded successfully!`);
      }
    } catch (error) {
      console.error(error);
      this.snackbarService.openSnack(`${file.name} upload failed!`);
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  onclick(event: any) {
    event.target.value = '';
  }

  async getImageEtag(file: File, presignedUrl: string) {
    let res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
    if (res && this.httpService.isHttpSuccess(res?.status)) {
      return res;
    }
    return null;
  }

  async processAttachmentData(files: any[]) {
    if (!files || files.length === 0) {
      return [];
    }

    const processedAttachments: any[] = [];

    for (const att of files) {
      let res: any = await this.getImageEtag(att.file, att.presignedUrl);
      if (res) {
        processedAttachments.push({
          fileKey: att.fileKey,
          eTag: res.headers.get(ETAG),
          fileName: att.file.name
        });
      } else {
        this.snackbarService.openSnack(`Failed to fetch eTag for ${att.file.name}`);
        return null;
      }
    }
    return processedAttachments;
  }

  async completeStage(): Promise<void> {
    const incompleteCount = 0

    if (incompleteCount > 0) {
      const pluralSuffix = incompleteCount > 1 ? 's' : '';
      this.snackbarService.openSnack(
        `Please complete ${incompleteCount} pending record${pluralSuffix} before completing this stage`
      );
      return;
    }

    const processedAttachments = await this.processAttachmentData(this.uploadedFiles);
    if (processedAttachments === null) {
      return;
    }

    this.submitLoading.set(true);

    this.apiHelperService.resolveClarification(this.data.clarificationId, processedAttachments)
      .subscribe({
        next: () => {
          this.snackbarService.openSnack('Stage completed successfully');
          this.dialogRef.close({ stageCompleted: true });
          this.submitLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.submitLoading.set(false);
          this.snackbarService.openSnack('Error completing stage');
        },
        complete: () => {
          this.submitLoading.set(false);
        }
      });
  }

  private mapApiCommentsToUI(apiComments: any[]): CommentRecord[] {
    return apiComments.map(apiComment => ({
      id: apiComment.commentId,
      author: this.data.dsrDetails.fullName,
      timestamp: new Date(apiComment.createdAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      avatar: (this.data.dsrDetails.fullName || 'U').slice(0, 2).toUpperCase(),
      mention: apiComment.metadata?.mentionedUserIds?.length
        ? `@${apiComment.metadata?.mentionedUserIds?.join(', ')}`
        : '',

      content: apiComment.content,
      isReply: apiComment.parentId !== 0,
      parentId: apiComment.parentId ?? 0,
      attachments: apiComment.attachments || [],
      createdAt: apiComment.createdAt
    }));
  }

  async fetchComments(): Promise<void> {
    this.isTabLoading.set(true);

    try {
      let res: any;

      if (this.data.viewType === TaskDialogTypes.TASK) {
        res = await this.apiHelperService.getTaskComments(
          this.data.dsrDetails.dsrFormId,
          this.data.taskId
        );
      } else if (this.data.viewType === "CLARIFICATION") {
        res = await this.apiHelperService.getClarificationComments(
          this.data.dsrDetails.dsrFormId,
          this.data.clarificationId
        );
      }

      const apiComments = res?.taskComments || [];
      this.commentsData = this.sortCommentsThreaded(
        this.mapApiCommentsToUI(apiComments)
      );
      this.updateUIAfterCommentChange();
      await this.initializeThreadingSystem();

    } catch (err) {
      console.error("Failed to load comments:", err);
      this.snackbarService.openSnack("Failed to load comments.");
    } finally {
      this.isTabLoading.set(false);
    }
  }

  async onDeleteComment(comment: CommentRecord): Promise<void> {
    if (this.isTabLoading()) return;

    try {
      if (this.data.viewType === TaskDialogTypes.TASK) {
        await firstValueFrom(
          this.apiHelperService.deleteTaskComment(
            this.data.dsrDetails.dsrFormId,
            this.data.taskId,
            comment.id
          )
        );
      } else if (this.data.viewType === "CLARIFICATION") {
        await firstValueFrom(
          this.apiHelperService.deleteClarificationComment(
            this.data.dsrDetails.dsrFormId,
            this.data.clarificationId,
            comment.id
          )
        );
      }

      this.snackbarService.openSnack("Comment deleted successfully");
      await this.fetchComments();

    } catch (error) {
      this.handleCommentError(error, "deleting comment");
    }
  }

  async onAddComment() {
    const processedAttachments = await this.processAttachmentData(this.uploadedFiles);
    if (processedAttachments === null) return;

    if (this.editingCommentId) {
      await this.updateComment(this.newCommentText, this.editingCommentId, this.parentIdForReply, processedAttachments);
    } else {
      await this.submitComment(this.newCommentText, this.parentIdForReply, processedAttachments);
    }

    this.resetCommentForm();
  }

  resetCommentForm() {
    this.newCommentText = '';
    this.uploadedFiles = [];
    this.editingCommentId = null;
    this.parentIdForReply = 0;
  }

  async submitComment(content: string, parentId: number = 0, attachments: any[] = []): Promise<void> {
    if ((!content.trim() && attachments.length === 0) || this.isTabLoading()) return;
    try {
      const payload = {
        content: content,
        parentId,
        attachments,
        metadata: { mentionedUserIds: this.mentionMap.map(m => m.id) }

      };

      if (this.data.viewType === TaskDialogTypes.TASK) {
        await firstValueFrom(
          this.apiHelperService.postTaskComment(
            payload,
            this.data.dsrDetails.dsrFormId,
            this.data.taskId
          )
        );
      } else if (this.data.viewType === TaskDialogTypes.CLARIFICATION) {
        await firstValueFrom(
          this.apiHelperService.postClarificationComment(
            payload,
            this.data.dsrDetails.dsrFormId,
            this.data.clarificationId
          )
        );
      }

      this.snackbarService.openSnack(parentId ? 'Reply added successfully' : 'Comment added successfully');
      await this.fetchComments();
    } catch (error) {
      this.handleCommentError(error, parentId ? 'adding reply' : 'adding comment');
    }
  }

  private sortCommentsThreaded(comments: CommentRecord[]): CommentRecord[] {
    const safeDate = (date?: string) => new Date(date ?? 0).getTime();
    const normParent = (id?: number | null) => id ?? 0;
    const childrenMap = new Map<number, CommentRecord[]>();
    for (const c of comments) {
      const pid = normParent(c.parentId);
      if (!childrenMap.has(pid)) {
        childrenMap.set(pid, []);
      }
      childrenMap.get(pid)!.push(c);
    }
    const buildThread = (parentId: number): CommentRecord[] => {
      const children = childrenMap.get(parentId) || [];
      children.sort((a, b) => safeDate(a.createdAt) - safeDate(b.createdAt));
      return children.flatMap(child => [child, ...buildThread(child.id)]);
    };

    return buildThread(0);
  }

  get description() {
    return this.data?.description
  }

  get title() {
    return this.data?.title
  }

  async updateComment(content: string, commentId: number, parentId: number, attachments: any[] = []): Promise<void> {
    if (!content.trim() || this.isTabLoading()) return;

    try {
      const payload = {
        content: content.trim(),
        parentId,
        attachments,
        metadata: { mentionedUserIds: this.mentionMap.map(m => m.id) }
      };

      if (this.data.viewType === TaskDialogTypes.TASK) {
        await firstValueFrom(this.apiHelperService.patchTaskComment(payload, this.data.dsrDetails.dsrFormId, this.data.taskId, commentId));
      } else if (this.data.viewType === TaskDialogTypes.CLARIFICATION) {
        await firstValueFrom(this.apiHelperService.patchClarificationComment(payload, this.data.dsrDetails.dsrFormId, this.data.clarificationId, commentId));
      }

      const idx = this.commentsData.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        this.commentsData[idx].content = content.trim();
        this.commentsData[idx].attachments = attachments;
      }

      this.snackbarService.openSnack('Comment updated successfully');
      this.editingCommentId = null;
      this.newCommentText = '';
      this.uploadedFiles = [];
      this.cdr.detectChanges();
    } catch (error) {
      this.handleCommentError(error, 'editing comment');
    }
  }

  onEditComment(comment: CommentRecord) {
    this.parentIdForReply = null;
    this.newCommentText = comment.content ?? '';
    this.uploadedFiles = (comment.attachments || []).map(file => ({
      ...file,
      name: this.getFileName(file.fileKey)
    }));

    this.editingCommentId = comment.id;
    this.parentIdForReply = comment.parentId ?? 0;
  }

  onReplyComment(comment: CommentRecord) {
    this.editingCommentId = null;
    this.newCommentText = `@${comment.author} `;
    this.parentIdForReply = comment.id ?? 0;
  }


  async onCommentInput(event: any) {
    const value = event.target.value;
    const cursorPos = event.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      const query = atMatch[1];
      if (query.length > 0) {
        try {
          const res: any = await this.apiHelperService.searchUsers(query);
          this.cdr.detectChanges();
          this.mentionResults = res || [];
          this.showMentionList = this.mentionResults.length > 0;
          this.cdr.detectChanges();
        } catch (err) {
          console.error('Failed to search users', err);
          this.showMentionList = false;
        }
      }
    } else {
      this.showMentionList = false;
    }
  }



  getAttachmentUrl(fileKey: string): string {
    return `/download/${fileKey}`;
  }

  mentionPosition = { top: 0, left: 0 };

  onQuillContentChanged(event: any) {
    if (this.preventMentionReopen) {
      this.preventMentionReopen = false;
      return;
    }

    let index = event.range?.index;

    try {
      index = event.editor?.getSelection()?.index ?? 0;
    } catch {
      index = 0;
    }

    const editorText = event.editor?.getText() ?? "";

    if ((index === 0 || index === undefined) && editorText.length > 0) {
      index = editorText.length - 1;
    }

    const textBeforeCursor = editorText.slice(0, index);
    const sanitized = textBeforeCursor.replace(/\n/g, ' ').trimEnd();

    const match = sanitized.match(/@(\w*)$/);
    const atOnlyMatch = /(^|\s)@$/.test(sanitized);

    if (atOnlyMatch || match) {
      this.mentionStartIndex = index - (match?.[0].length ?? 1);
      const query = match?.[1] ?? "";

      const bounds = event.editor?.getBounds(index);
      this.mentionPosition = {
        top: bounds.top + 25,
        left: bounds.left + 5
      };

      this.apiHelperService.searchUsers(query).then((res: any) => {
        this.mentionResults = res || [];
        this.showMentionList = this.mentionResults.length > 0;
        this.cdr.detectChanges();
      });
    } else {
      this.showMentionList = false;
    }
  }

  selectMention(user: any): void {
    this.showMentionList = false;
    this.cdr.detectChanges();
    const editor = this.quillEditorComponent?.quillEditor;

    if (!editor || this.mentionStartIndex === null) return;
    const fullText = editor.getText();
    const textAfterMention = fullText.slice(this.mentionStartIndex);
    const match = textAfterMention.match(/^@(\w*)/);
    const typedMention = match?.[0] ?? '';
    const deleteLength = typedMention.length;
    editor.deleteText(this.mentionStartIndex, deleteLength);
    const mentionText = `@${user.firstName} `
    editor.insertText(this.mentionStartIndex, mentionText, { mention: true });
    editor.setSelection(this.mentionStartIndex + mentionText.length + 1);

    if (!this.mentionMap.some(m => m.id === user.applicationUserId)) {
      this.mentionMap.push({ name: user.firstName, id: user.applicationUserId });
    }
    this.preventMentionReopen = true;
    this.mentionStartIndex = null;
  }

  getInitials(first: string, last: string): string {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  }

  getUserColor(user: any): string {
    return '#6366F1';
  }

  onLeftTabChange(event: MatTabChangeEvent) {

  }

  get sendBtnIsDisabled() {
    return !this.newCommentText?.trim() && this.uploadedFiles.length === 0
  }
  // private createNewRecord() {
  //   const formValues: any = this.addRecordForm.value;
  //   return {
  //     id: this.dataFullFillmentRecordsData.length + 1,
  //     category: formValues.category,
  //     foundIn: formValues.foundIn,
  //     purpose: formValues.purpose,
  //     exempted: formValues.exemption,
  //     justification: formValues.justification
  //   };
  // }

  // private addNewRecord(record: RequestDataFulfillmentRecords): void {
  //   this.dataFullFillmentRecordsData = [...this.dataFullFillmentRecordsData, record];
  //   this.totalRecordsCount = this.dataFullFillmentRecordsData.length;
  // }

  // readonly incompleteRecordsCount = computed(() =>
  //   this.dataFullFillmentRecordsData.filter(record =>
  //     !record.exempted || !record.justification.trim()
  //   ).length
  // );


  sortColumn<K extends keyof RequestDataFulfillmentRecords>(columnName: K): void {
    this.updateSortDirection(columnName);
    // this.applySorting(columnName);
    this.cdr.detectChanges();
  }

  private updateSortDirection<K extends keyof RequestDataFulfillmentRecords>(columnName: K): void {
    if (this.currentSortColumn === columnName) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = columnName;
      this.sortDirection = 'asc';
    }
  }

  // private applySorting<K extends keyof RequestDataFulfillmentRecords>(columnName: K): void {
  //   this.dataFullFillmentRecordsData = [...this.dataFullFillmentRecordsData].sort((a, b) => {
  //     const valueA = a[columnName];
  //     const valueB = b[columnName];

  //     const nullComparison = this.handleNullValues(valueA, valueB);
  //     if (nullComparison !== null) return nullComparison;

  //     const comparison = this.compareValues(valueA, valueB);
  //     return this.sortDirection === 'desc' ? -comparison : comparison;
  //   });
  // }


  // readonly completedRecordsCount = computed(() =>
  //   this.dataFullFillmentRecordsData.filter(record =>
  //     record.exempted !== 'Pending' && record.justification.trim()
  //   ).length
  // );

  // getOverallStatus(): string {
  //   const incomplete = this.incompleteRecordsCount();
  //   const total = this.totalRecordsCount;

  //   if (incomplete === 0) return 'Completed';
  //   if (incomplete === total) return 'Not Started';
  //   return 'In Progress';
  // }

  // getProgressPercentage(): number {
  //   if (this.totalRecordsCount === 0) return 0;
  //   const completed = this.completedRecordsCount();
  //   return Math.round((completed / this.totalRecordsCount) * 100);
  // }
}

