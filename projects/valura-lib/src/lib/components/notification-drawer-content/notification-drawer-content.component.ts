import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { DatePipe, NgClass } from '@angular/common';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-notification-drawer-content',
  imports: [
    DatePipe,
    NgClass
  ],
  templateUrl: './notification-drawer-content.component.html',
  styleUrl: './notification-drawer-content.component.scss'
})
export class NotificationDrawerContentComponent implements OnChanges {
  @Input() notifications!: any[];
  @Input() isViewAllLoading = false;
  @Input() isMarkAllLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() isLoadingMore = false;

  @Output() onCloseDrawer = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<any>();
  @Output() viewAllClick = new EventEmitter<void>();
  @Output() markAllAsReadClick = new EventEmitter<void>();
  @Output() loadMoreNotifications = new EventEmitter<void>();

  private isLoadingInProgress = false;

  onViewAll(): void {
    if (this.isViewAllLoading) return;
    this.viewAllClick.emit();
  }

  onMarkAllAsRead(): void {
    if (this.isMarkAllLoading) return;
    this.markAllAsReadClick.emit();
  }

  removeLinks(html: string): string {
    if (!html) return '';
    return html.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '');
  }

  get hasUnreadNotifications(): boolean {
    return this.notifications?.some(n => !n.isRead) ?? false;
  }

  isToday(date: string | Date): boolean {
    const today = new Date();
    const created = new Date(date);

    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  }

  closeDrawer() {
    this.onCloseDrawer.emit();
  }

  onNotificationClick(notification: any) {
    this.notificationClick.emit(notification);
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const atBottom = distanceFromBottom < 50;



    if (atBottom && !this.isLoadingInProgress && !this.isLoadingMore) {
      if (this.currentPage < this.totalPages) {
        this.isLoadingInProgress = true;
        this.loadMoreNotifications.emit();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isLoadingMore'] && !this.isLoadingMore) {
      this.isLoadingInProgress = false;
    }
  }
}
