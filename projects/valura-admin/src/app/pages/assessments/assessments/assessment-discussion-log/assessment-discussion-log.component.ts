import {
  Component, ChangeDetectorRef, OnInit, Input, inject, ViewChild, ElementRef, Output, EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ApiHelperService as NetworkApiHelper } from '@admin-core/services/network/api-helper.service';
import { AssessmentAttachedTo } from '../constants';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';

export interface DiscussionLogMessage {
  id: number;
  message: string;
  createdAt: string;
  senderId: number;
  senderUserType: 'ADMIN_USER' | 'EXTERNAL_USER';
  senderName: string;
  isRead: boolean;
  discussionType: 'RESPONSE' | 'REMARK';
  sourceType: string;
  sourceId: number;
  sourceTitle: string;
  sectionId: number;
  questionDisplayOrder: number;
  sectionDisplayOrder: number;
  attachments: { fileKey: string; fileName: string }[];
}

export interface DiscussionLogNavigationTarget {
  sectionId: number;
  questionId: number;
  messageId: number;
  parentId: number;
  conversationPage: number;
  childCount: number;
}

@Component({
  selector: 'app-assessment-discussion-log',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './assessment-discussion-log.component.html',
  styleUrl: './assessment-discussion-log.component.scss'
})
export class AssessmentDiscussionLogComponent implements OnInit, OnChanges {

  @Input() assessmentId!: number;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @Output() navigateToMessage = new EventEmitter<DiscussionLogNavigationTarget>();
  @Output() navigateToTask = new EventEmitter<{ taskId: number; messageId: number }>();

  private cdr = inject(ChangeDetectorRef);
  private apiHelper = inject(ApiHelperService);
  private networkApiHelper = inject(NetworkApiHelper)
  private dialog = inject(MatDialog);

  conversationMessages: DiscussionLogMessage[] = [];
  isLoadingConversation = false;
  isLoadingMore = false;
  isNavigating = false;

  currentPage = 1;
  readonly pageSize = 10;
  hasMoreMessages = true;
  activeFilter: 'ALL' | 'REMARK' | 'RESPONSE' = 'ALL';
  AssessmentAttachedTo = AssessmentAttachedTo;

  ngOnInit(): void {
    this.loadDiscussionLogs();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessmentId'] && !changes['assessmentId'].firstChange) {
      this.currentPage = 1;
      this.conversationMessages = [];
      this.hasMoreMessages = true;
      this.activeFilter = 'ALL';
      this.loadDiscussionLogs();
    }
  }
  setFilter(filter: 'ALL' | 'REMARK' | 'RESPONSE'): void {
    if (this.activeFilter === filter) return;
    this.activeFilter = filter;
    this.currentPage = 1;
    this.conversationMessages = [];
    this.hasMoreMessages = true;
    this.loadDiscussionLogs();
  }
  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (atBottom && !this.isLoadingMore && this.hasMoreMessages) {
      this.currentPage++;
      this.loadDiscussionLogs(true);
    }
  }

  async downloadAttachment(event: MouseEvent, attachment: { fileKey: string; fileName: string }): Promise<void> {
    event.stopPropagation();
    if (!attachment.fileKey) return;

    try {
      const imageInfo = await this.networkApiHelper.getPresignedUrl({ fileKey: attachment.fileKey });
      if (imageInfo?.presignedUrl) {
        this.dialog.open(DocViewerDialogComponent, {
          data: {
            doc: imageInfo.presignedUrl,
            fileName: attachment.fileName || '',
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

  async onMessageClick(message: DiscussionLogMessage): Promise<void> {
    if (this.isNavigating) return;
    this.isNavigating = true;
    this.cdr.detectChanges();

    try {

      if (message.sourceType == 'TASK') {
        this.navigateToTask.emit({ taskId: message.sourceId, messageId: message.id });
      }
      else {
        const pageInfo = await this.apiHelper.getConversationPageInfo(
          this.assessmentId,
          'QUESTION',
          message.sourceId,
          message.id,
          10
        );

        if (pageInfo) {
          const target: DiscussionLogNavigationTarget = {
            sectionId: message.sectionId,
            questionId: message.sourceId,
            messageId: message.id,
            parentId: pageInfo.parentId,
            conversationPage: pageInfo.conversationPage,
            childCount: pageInfo.childCount ?? 0
          };
          this.navigateToMessage.emit(target);
        }
      }

    } catch (e) {
      console.error('Error getting page info:', e);
    } finally {
      this.isNavigating = false;
      this.cdr.detectChanges();
    }
  }
  private async loadDiscussionLogs(isLoadMore = false): Promise<void> {
    isLoadMore ? this.isLoadingMore = true : this.isLoadingConversation = true;
    this.cdr.detectChanges();

    const data = await this.apiHelper.getAssessmentDiscussionLogs(
      this.assessmentId,
      this.currentPage,
      this.pageSize,
      this.activeFilter === 'ALL' ? undefined : this.activeFilter
    );

    if (data?.discussionLogs) {
      const incoming = data.discussionLogs as DiscussionLogMessage[];
      this.conversationMessages = isLoadMore
        ? [...this.conversationMessages, ...incoming]
        : incoming;
      this.hasMoreMessages = this.currentPage < (data.totalPages ?? 1);
    }

    this.isLoadingConversation = false;
    this.isLoadingMore = false;
    this.cdr.detectChanges();
  }
}