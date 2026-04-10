import { Component, EventEmitter, inject, Output, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@admin-core/services/auth.service';
import { NavigationStart, Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { RouteBreadCrumbs } from '@admin-core/models/RouteBreadCrumbs';
import { NotificationDrawerContentComponent } from '../../notification-drawer-content/notification-drawer-content.component';
import { MatDrawer, MatDrawerContainer, MatSidenav } from '@angular/material/sidenav';
import { FIRST_PAGE } from '../../../../pages/task-management/constant';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatBadge } from '@angular/material/badge';
import { PAGE_SIZE } from '../../../../pages/request-management/constant';
import { NotificationNavigationService } from '@admin-core/services/notification-navigation.service';
import { RouteService } from '@admin-core/services/route.service';
import { UserService } from '@admin-core/services/user/user.service';
import { EntityList } from '@admin-core/models/Entity';
import { DbService } from '@admin-core/services/db/db.service';
import { SET_PASSWORD_NAVIGATION_TYPE } from '@admin-core/constants/constants';
import { Subscription, filter } from 'rxjs';


const { USER, ADMIN, USER_PROFILE, DOWNLOAD } = routeConstants
@Component({
  selector: 'topbar',
  imports: [MatIconModule, MatIconButton, MatToolbar, NgClass, MatMiniFabButton, MatMenuModule, MatDrawer, MatDrawerContainer, NotificationDrawerContentComponent, MatBadge],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],

})
export class TopbarComponent implements OnInit, OnDestroy {

  @Output() toggle = new EventEmitter<void>();
  @Input() isCollapsed = false;

  displayName: string = '';
  routeBreadCrumbsList: RouteBreadCrumbs[] = [];
  notifications: any[] = [];
  entityList: EntityList[] = []
  unreadNotificationCount = 0;
  pageSize: number = PAGE_SIZE;
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE
  totalPages = 0;
  isExternalUser: boolean = false;
  isInternalUser: boolean = false;
  notificationLoading: boolean = false;
  isMarkAllLoading: boolean = false;
  entities: any[] = [];
  selectedEntity: any = null;
  isLoading: boolean = false;
  isEntityLoading: boolean = false;


  private authService = inject(AuthService);
  private routeService = inject(RouteService);
  private apiHelperService = inject(ApiHelperService);
  private notificationNavService = inject(NotificationNavigationService);
  private userService = inject(UserService);
  private dbService = inject(DbService);
  private notificationUpdateSubscription!: Subscription;
  private profileUpdatedSubscription!: Subscription;

  @ViewChild('notificationDrawer') notificationDrawer!: MatSidenav;

  private routerSub = new Subscription();

  constructor(private router: Router) {
    this.profileUpdatedSubscription = this.userService.profileUpdated$.subscribe(value => {
      if (value) {
        this.getUserName();
      }
    });
    this.notificationUpdateSubscription = this.notificationNavService.notificationCountIsUpdated$.subscribe(data => {
      if (data) {
        this.unreadNotificationCount = data?.count ?? 0;
      }
    });
  }

  ngOnInit(): void {
    this.isExternalUser = this.authService.isExternalUser;
    this.isInternalUser = this.authService.isInternalUser;
    this.getRoutesBreadCrumbs();
    this.getEntityList();
    this.getUserName();
    this.loadUnreadCount();
    this.loadEntities();
    this.routeService.onRouteAction$.subscribe(res => {
      if (res) {
        this.getRoutesBreadCrumbs()
      }
    });

    this.routerSub.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationStart))
        .subscribe(() => {
          this.notificationDrawer?.close();
        })
    );
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.profileUpdatedSubscription?.unsubscribe();
    this.notificationUpdateSubscription?.unsubscribe();
  }

  private async loadUnreadCount() {
    if (this.showNotificationMenu) {
      await this.getUnreadNotificationCount();
    }
  }

  loadEntities() {
    const entityList = this.authService.getEntityList();
    if (entityList) {
      this.entities = entityList;
      this.selectedEntity = this.entities.find(e => e.isCurrent) || this.entities[0];
    }
  }

  async getUserName() {
    this.isLoading = true;

    try {
      const currentUserId = this.authService.getUserInfo()?.applicationUserId ?? 0;
      const user = await this.userService.getUserById(currentUserId);
      const userName = this.userService.getDisplayName(user);

      this.displayName = userName ?? 'Guest';

    } catch (error) {
      this.displayName = 'Guest';
    } finally {
      this.isLoading = false;
    }
  }


  getEntityList() {
    this.entityList = this.authService.getEntityList() ?? [];
  }

  async onEntitySwitch(entity: EntityList) {
    if (entity.isCurrent) {
      return
    }
    const data = await this.apiHelperService.getEntitySwitchData({
      entityId: entity.id
    });

    if (!data) return;
    await this.dbService.deleteDatabase();
    const _data = { ...data, setPasswordNavigationType: SET_PASSWORD_NAVIGATION_TYPE.LOGIN }
    this.authService.doLogin(_data);
  }

  hasAnyAction(): boolean {
    return this.entityList?.some(e => e.needsAction);
  }

  getTotalActionCount(): number {
    return this.entityList
      ?.filter(e => e.needsAction)
      .reduce((sum, e) => sum + (e.actionItemsCount || 0), 0);
  }


  logOut() {
    this.authService.logOut()
  }

  userInfo = {
    profilePhoto: '/assets/images/profile_2.png',
  };

  goToProfile() {
    if (this.authService.authUser) {
      this.router.navigate([`${ADMIN}/${USER_PROFILE}`])
      return
    }
    this.router.navigate([`${USER}/${USER_PROFILE}`])
  }

  getRoutesBreadCrumbs() {
    this.routeBreadCrumbsList = this.routeService.getRoutesBreadCrumbs()
  }

  navigateToRoute(breadcrumb: RouteBreadCrumbs) {
    this.router.navigate([breadcrumb.url])
  }

  openNotifications() {
    this.notificationDrawer.open()
    this.loadNotification()
  }

  openexportData() {
    this.router.navigate([`${USER}/${DOWNLOAD}`])
  }

  async getUnreadNotificationCount() {
    try {
      const res = await this.apiHelperService.getUnreadNotificationCount();
      this.unreadNotificationCount = res?.unreadCount ?? res?.count ?? 0;
    } catch (error) {
      console.error('Failed to get unread notification count:', error);
      this.unreadNotificationCount = 0;
    }
  }

  async loadNotification(pageNo: number = FIRST_PAGE, filters: any = null) {
    let params = {
      page: pageNo,
      size: this.pageSize,
    }
    this.notificationLoading = true;
    const res = await this.apiHelperService.getNotification(params);
    this.pageNo = pageNo;

    if (res) {
      this.totalItems = res.totalCount ?? 0;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      const notifications = res.notifications ?? [];
      if (pageNo === FIRST_PAGE) {
        this.notifications = [...notifications];
      } else {
        this.notifications = [...this.notifications, ...notifications];
      }
    }
    this.notificationLoading = false;
  }

  loadNextPage() {
    if (!this.notificationLoading && this.pageNo < this.totalPages) {
      this.loadNotification(this.pageNo + 1);
    }
  }

  async handleNotificationClick(notification: any) {
    if (!notification.isRead) {
      await this.markNotificationAsRead(notification.traceId);
      notification.isRead = true;
      await this.getUnreadNotificationCount();
    }

    const navEntityType = notification?.module || notification?.entityType;
    if (navEntityType && notification?.entityId) {
      const navigationSuccess = await this.notificationNavService.navigateToEntity(
        navEntityType,
        notification.entityId,
        notification.navigationMeta
      );

      if (navigationSuccess) {
        this.notificationDrawer.close();
      }
    } else {
      this.notificationDrawer.close();
    }
  }

  async markNotificationAsRead(traceId: string) {
    try {
      await this.apiHelperService.markNotificationAsRead(traceId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async handleMarkAllAsRead() {
    if (this.isMarkAllLoading) return;

    this.isMarkAllLoading = true;
    try {
      await this.apiHelperService.markAllNotificationsAsRead();
      this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
      await this.getUnreadNotificationCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      this.isMarkAllLoading = false;
    }
  }

  get badgeValue(): string | number {
    const count = this.unreadNotificationCount;

    if (count <= 99) {
      return count;
    } else if (count < 1000) {
      return '99+';
    }

    try {
      const locale = 'en';
      const formatter = new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 0,
      });
      const formatted = formatter.format(count);
      const isExactMultiple = count % 1000 === 0 || count % 1000000 === 0 || count % 1000000000 === 0;
      return isExactMultiple ? formatted : `${formatted}+`;
    } catch (e) {
      return '99+';
    }
  }

  get showNotificationMenu() {
    return (this.isInternalUser || this.isExternalUser || this.authService.authUser) ? false : true
  }

  get hideNotificationBadge() {
    return !this.unreadNotificationCount || this.unreadNotificationCount <= 0
  }
}
