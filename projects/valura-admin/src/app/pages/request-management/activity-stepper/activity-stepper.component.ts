import { Component, ElementRef, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import { formatDate, NgClass } from '@angular/common';
import { FIRST_PAGE, PAGE_SIZE } from '../constant';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuditLogs } from '@admin-core/models/request-management/DsrRequest';
import { UserService } from '@admin-core/services/user/user.service';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ACTIVITY, ACTIVITY_LOG_ACTOR } from '@admin-core/constants/constants';
@Component({
  selector: 'app-activity-stepper',
  imports: [NgClass, MatProgressSpinner, ItemNotFoundComponent],
  templateUrl: './activity-stepper.component.html',
  styleUrl: './activity-stepper.component.scss'
})
export class ActivityStepperComponent {
  @Input() showHeader = false;
  @Input() selectedIndex = 0;
  @Input() entityId: number = 0;
  @Input() auditLogModule: string = '';
  @Input() entityType: string = '';
  @Input() userAuditLog: boolean = false;
  @Input() userId: number | undefined;


  auditlogs: AuditLogs[] = [];
  formatDate = formatDate;

  pageSize: number = PAGE_SIZE
  FIRST_PAGE = FIRST_PAGE
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE
  totalPages = 0;
  requestLoading: boolean = false;
  initialLoading: boolean = false;
  paginationLoading: boolean = false;
  centralauditLog: boolean = false;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private userService = inject(UserService);
  private apiHelperService = inject(ApiHelperService);

  constructor() { }

  ngOnInit() {
    // this.getAuditLogs(); //commented to avoid multiple API call
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId']) {
      if (this.entityId && this.auditLogModule && this.entityType) {
        this.getAuditLogs();
        return
      }
    }
    if (changes['entityType']) {
      if (this.entityType) {
        this.getAuditLogs();
      }
    }
    if (changes['userAuditLog']) {
      if (this.userAuditLog) {
        this.getAuditLogs();
      }
    }
  }

  async getAuditLogs(pageNo: number = FIRST_PAGE, filters: any = null) {
    let params = {
      page: pageNo,
      size: this.pageSize,
    }
    if (pageNo === FIRST_PAGE) {
      this.initialLoading = true;
    } else {
      this.paginationLoading = true;
    }
    this.requestLoading = true;
    if (this.userAuditLog) {
      const res = await this.apiHelperService.getCentralAuditLogs(params, this.userId);
      this.pageNo = pageNo;
      if (res) {
        this.totalPages = res.totalPages;
        const auditlogs: AuditLogs[] = await this.setAuditLogsActor(res?.auditLogs ?? []);
        if (pageNo === FIRST_PAGE) {
          this.auditlogs = [...auditlogs];
        } else {
          this.auditlogs = [...this.auditlogs, ...auditlogs];
        }
      }
    }
    else {
      if (this.entityId === 0 || this.entityId === undefined || this.entityId === null) {
        this.entityId = 0;
      } else {
        this.entityId = Number(this.entityId);
      }
      const res = await this.apiHelperService.getAuditLogs(this.auditLogModule, this.entityType, this.entityId, params);
      this.pageNo = pageNo;

      if (res) {
        this.totalPages = res.totalPages;
        const auditlogs: AuditLogs[] = await this.setAuditLogsActor(res?.items ?? []);
        if (pageNo === FIRST_PAGE) {
          this.auditlogs = [...auditlogs];
        } else {
          this.auditlogs = [...this.auditlogs, ...auditlogs];
        }
      }
    }
    this.requestLoading = false;
    this.initialLoading = false;
    this.paginationLoading = false;
  }



  async setAuditLogsActor(auditlogs: AuditLogs[]) {
    if (!auditlogs?.length) return auditlogs;
    for (let i = 0; i < auditlogs.length; i++) {
      const auditLogs = auditlogs[i];
      const actorId = +(auditLogs.actorId ?? 0);
      let actorName = "";
      if (auditLogs.actorType === ACTIVITY_LOG_ACTOR.ADMIN_USER || auditLogs.actorType === ACTIVITY_LOG_ACTOR.APP_USER) {
        const user = await this.userService.getUserById(actorId);
        const userName = this.userService.getDisplayName(user);
        actorName = userName ? userName : ACTIVITY.ACTOR_USER;
      }
      else if (auditLogs.actorType === ACTIVITY_LOG_ACTOR.SYSTEM) {
        actorName = ACTIVITY.ACTOR_SYSTEM;
      }
      else if (auditLogs.actorType === ACTIVITY_LOG_ACTOR.DS) {
        actorName = ACTIVITY.ACTOR_DS;
      }
      else if (auditLogs.actorType === ACTIVITY_LOG_ACTOR.THIRD_PARTY) {
        actorName = ACTIVITY.ACTOR_THIRD_PARTY;
      }
      else {
        actorName = ACTIVITY.ACTOR_USER;
      }
      auditlogs[i] = { ...auditLogs, actorName, actorId };
    }
    return auditlogs
  }

  formatText(value: string): string {
    if (!value) return '';

    const words = value.split(' ');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const formattedWords = words.map(word => {
      if (emailRegex.test(word)) {
        return word;
      }

      return word
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    });

    return formattedWords.join(' ');
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = (event.pageIndex + 1)
      this.getAuditLogs(this.pageNo);
    }
  }

  onScroll(event: any) {
    const element = event.target;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;

    if (atBottom && !this.requestLoading && this.pageNo < this.totalPages) {
      this.getAuditLogs(this.pageNo + 1);
    }
  }
}
