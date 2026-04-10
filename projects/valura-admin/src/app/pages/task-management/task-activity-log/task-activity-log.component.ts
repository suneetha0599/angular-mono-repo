import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FIRST_PAGE, PAGE_SIZE, ACTIVITY } from '../constant';
import { ActivityLogUI } from '../constant';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { UserService } from '@admin-core/services/user/user.service';
import { AuditLogs } from '@admin-core/models/request-management/DsrRequest';
import { ACTIVITY_LOG_ACTOR, AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE } from '@admin-core/constants/constants';
import { AuthService } from '@admin-core/services/auth.service';
import { ActivityLogComponent } from '../activity-log/activity-log.component';

@Component({
  selector: 'app-task-activity-log',
  standalone: true,
  imports: [CommonModule, ActivityLogComponent],
  templateUrl: './task-activity-log.component.html',
})
export class TaskActivityLogComponent implements OnInit {

  @Input() taskId!: number;
  activityLogs: ActivityLogUI[] = [];
  pageSize = PAGE_SIZE;
  pageNo = FIRST_PAGE;
  totalPages = 0;
  requestLoading = false;
  initialLoading = true;
  paginationLoading = false;
  activityLogVisibility = false;

  private apiHelperService = inject(ApiHelperService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (this.taskId) {
      this.getAuditLogs();
    }
  }

  async getAuditLogs(pageNo: number = FIRST_PAGE): Promise<void> {
    const params = {
      page: pageNo,
      size: this.pageSize,
    };

    pageNo === FIRST_PAGE
      ? (this.initialLoading = true)
      : (this.paginationLoading = true);

    this.requestLoading = true;

    const res = await this.apiHelperService.getAuditLogs(AUDIT_LOG_MODULE.TASK_MANAGEMENT, AUDIT_LOG_ENTITY_TYPE.TASK, this.taskId, params);

    this.pageNo = pageNo;
    if (res?.items) {
      this.totalPages = res.items.totalPages;
      const auditLogs = await this.setAuditLogsActor(res.items ?? []);
      const mappedLogs = this.mapAuditLogsToUI(auditLogs);

      if (pageNo === FIRST_PAGE && mappedLogs.length > 0) {
        this.activityLogVisibility = true;
      }

      this.activityLogs =
        pageNo === FIRST_PAGE
          ? mappedLogs
          : [...this.activityLogs, ...mappedLogs];
    }

    this.requestLoading = false;
    this.initialLoading = false;
    this.paginationLoading = false;
  }

  mapAuditLogsToUI(auditlogs: AuditLogs[]): ActivityLogUI[] {
    return auditlogs.map(log => ({
      id: log.id,
      user: log.actorName ?? ACTIVITY.ACTOR_SYSTEM,
      action: log.action,
      comment: undefined,
      time: this.formatText(log.timestamp),
    }));
  }

  async setAuditLogsActor(auditlogs: AuditLogs[]): Promise<AuditLogs[]> {
    for (const log of auditlogs) {
      if ((log.actorType === ACTIVITY_LOG_ACTOR.ADMIN_USER || log.actorType === ACTIVITY_LOG_ACTOR.APP_USER) && log.actorId) {
        const actorId = +(log.actorId ?? 0);
        let userName = '';
        if (this.isInternalOrExternalUser) {
          log.actorName = log.actorName ?? ACTIVITY.ACTOR_USER;
        }
        else {
          const user = await this.userService.getUserById(actorId);
          userName = this.userService.getDisplayName(user);
          log.actorName = userName ?? ACTIVITY.ACTOR_USER;
        }
      }
      else {
        log.actorName =
          ACTIVITY[`ACTOR_${log.actorType}` as keyof typeof ACTIVITY] ??
          ACTIVITY.ACTOR_SYSTEM;
      }
    }
    return auditlogs;
  }

  formatText(value: string): string {
    if (!value) return '';

    const isoDate = new Date(value);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    const words = value.split(' ');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const formattedWords = words.map(word => {
      if (emailRegex.test(word)) {
        return word;
      }

      return word
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
    });

    return formattedWords.join(' ');
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }
}
