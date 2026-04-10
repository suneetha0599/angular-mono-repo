import { NgToastService } from "ng-angular-popup";
import { NotificationNavigationService } from "../notification-navigation.service";
import { Injectable, NgZone } from "@angular/core";
import { AuthService } from "../auth.service";
import { ApiHelperService } from "../network/api-helper.service";
import { DbService } from "../db/db.service";
import { SET_PASSWORD_NAVIGATION_TYPE } from "@admin-core/constants/constants";
import { NavigationMeta } from "@admin-core/models/notification.model";

@Injectable({ providedIn: 'root' })
export class NotificationPopupService {

  constructor(
    private toast: NgToastService,
    private navigation: NotificationNavigationService,
    private ngZone: NgZone,
    private authService: AuthService,
    private apiHelperService: ApiHelperService,
    private dbService: DbService
  ) { }

  showNotification(payload: {
    subEntity?: string;
    subEntityId?: number;
    message: string;
    title?: string;
    entityType: string;
    entityId: string;
    traceId: string;
    entity: string;
    module?: string;
    navigationMeta?: NavigationMeta;
  }): void {

    this.toast.info(
      payload.message,
      payload.title || 'Notification',
      6000,
      true,
      true,
      true
    );

    const observer = new MutationObserver(() => {
      const toasts = document.querySelectorAll('.toast-message');
      if (!toasts.length) return;

      const lastToast = toasts[toasts.length - 1] as HTMLElement;
      lastToast.style.cursor = 'pointer';
      lastToast.onclick = () => {
        this.ngZone.run(async () => {
          const currentEntityId = this.getCurrentEntityId();
          if (currentEntityId && currentEntityId !== payload.entity) {
            this.authService.setAppReady(false);

            const params = { entityId: payload.entity, notificationId: payload.traceId };
            const data = await this.apiHelperService.getEntitySwitchData(params);
            if (!data) return;
            await this.dbService.deleteDatabase();
            const _data = { ...data, setPasswordNavigationType: SET_PASSWORD_NAVIGATION_TYPE.LOGIN };
            await this.authService.doLogin(_data);
            await this.authService.waitUntilReady();
          }

          this.navigation.navigateToEntity(
            payload.module || payload.entityType,
            payload.entityId,
            payload.navigationMeta
          );
        });
      };

      observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private getCurrentEntityId(): string | null {
    const entities = this.authService.getEntityList() ?? [];
    const current = entities.find(e => e.isCurrent);
    return current?.id ?? null;
  }
}

