import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteBreadCrumbs } from '@admin-core/models/RouteBreadCrumbs';
import { LSK_NOTIFICATION_UNREAD_COUNT, LSK_ROUTE_BREADCRUMBS } from '@admin-core/constants/local-storage-constants';
import { getItem, setItem } from '@valura-lib/utils/local-storage-util';
import { BehaviorSubject } from 'rxjs';
import { v1 as uuidv1 } from 'uuid';
import { AuthService } from './auth.service';
import { ApiHelperService } from './network/api-helper.service';

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  breadcrumbData: any = [];
  public onRouteAction$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private authService = inject(AuthService);
  private apiHelperService = inject(ApiHelperService);

  constructor() { }


  generateRouteBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: RouteBreadCrumbs[] = []): { label: string, url: string }[] {
    const routeURL: string = route.snapshot.url
      .map(segment => segment.path)
      .join('/');

    if (routeURL) {
      url += `/${routeURL}`;
    }

    const label: string = route.snapshot.data?.['title'];
    const defaultRoute = route.snapshot.data?.['defaultRoute'];

    if (label && !defaultRoute) {
      const breadcrumb = new RouteBreadCrumbs({ id: uuidv1(), label: label, url: url, })
      breadcrumbs.push(breadcrumb);
    }
    for (const child of route.children) {
      this.generateRouteBreadcrumbs(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }

  setRoutesBreadCrumbs(route: ActivatedRoute) {
    const breadcrumbsList = this.generateRouteBreadcrumbs(route);
    setItem(LSK_ROUTE_BREADCRUMBS, breadcrumbsList);
    this.breadcrumbData = [...breadcrumbsList];
    this.onRouteAction$.next(true);
  }

  getRoutesBreadCrumbs() {
    if (this.breadcrumbData?.length) {
      return this.breadcrumbData
    }
    const breadcrumbsList = getItem(LSK_ROUTE_BREADCRUMBS);
    this.breadcrumbData = [...breadcrumbsList];
    return breadcrumbsList
  }

  async getUnreadNotificationCount(forceLoad: boolean = false): Promise<number> {
    if (this.authService.isExternalUser || this.authService.isInternalUser || this.authService.authUser) {
      return 0;
    }

    let unreadCount = localStorage.getItem(LSK_NOTIFICATION_UNREAD_COUNT);
    if (!forceLoad && unreadCount !== null) {
      return Number(unreadCount);
    }
    try {
      const res = await this.apiHelperService.getUnreadNotificationCount();
      const count = res.count ?? 0;
      localStorage.setItem(LSK_NOTIFICATION_UNREAD_COUNT, String(count));
      return count;
    } catch (e) {
      console.error('Error fetching unread notification count', e);
      return unreadCount !== null ? Number(unreadCount) : 0;
    }
  }
}
