import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Overlay, CloseScrollStrategy } from '@angular/cdk/overlay';
import { MAT_AUTOCOMPLETE_SCROLL_STRATEGY } from '@angular/material/autocomplete';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { RouteService } from '@admin-core/services/route.service';
import { NgToastComponent } from 'ng-angular-popup';
import { SseService } from '@valura-lib/service/sse/sse.service';
import { NotificationPopupService } from '@admin-core/services/notification/nofication-popup.service';
import { AuthService } from '@admin-core/services/auth.service';
import { NGXLogger } from 'ngx-logger';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { NOTIFICATION_MESSAGE_TYPE } from '@admin-core/constants/constants';
import { NotificationNavigationService } from '@admin-core/services/notification-navigation.service';
import { environment } from '../environments/environment';

export function scrollFactory(overlay: Overlay): () => CloseScrollStrategy {
  return () => overlay.scrollStrategies.close();
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    {
      provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
      useFactory: scrollFactory,
      deps: [Overlay],
    },
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'valura';

  private routeService = inject(RouteService);
  private sseService = inject(SseService);
  private notificationService = inject(NotificationPopupService);
  private notificationNavigationService = inject(NotificationNavigationService);
  private authService = inject(AuthService);
  private logger = inject(NGXLogger);
  private sseSubscription?: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private apiHelperService: ApiHelperService
  ) { }

  ngOnInit(): void {
    this.logger.debug('App Component Initialized');
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.routeService.setRoutesBreadCrumbs(this.activatedRoute.root);
        this.tryStartSse();
      });
  }

  private tryStartSse(): void {
    if (this.sseSubscription) return;

    const token = this.authService.getAuthToken();
    if (!token) {
      this.logger.warn('SSE: No auth token found, skipping connection');
      return;
    }
    this.logger.info('SSE: Attempting to connect...');
    this.sseSubscription = this.sseService
      .connect(environment.sseApi, token)
      .subscribe({
        next: event => this.handleSseEvent(event),
        error: err => {
          this.logger.error('SSE Connection Error:', err);
          this.sseSubscription = undefined;
        },
      });
  }
  private handleSseEvent(event: MessageEvent): void {
    if (!event.data) return;

    this.logger.debug('SSE: Raw event received', event.data);

    if (typeof event.data === 'string' && !event.data.trim().startsWith('{')) {
      return;
    }
    try {
      const payload = JSON.parse(event.data);
      const messageType = payload?.messageType;
      if (messageType == NOTIFICATION_MESSAGE_TYPE.NOTIFICATION_COUNT) {
        const data = { count: payload?.content }
        this.notificationNavigationService.notificationCountIsUpdated$.next(data);
        return
      }
      if (messageType == NOTIFICATION_MESSAGE_TYPE.RESPONDENT_AS_AUTHOR_SUBMITTED) {
        return
      }
      const notificationEntityId = String(payload.traceId);

      this.notificationService.showNotification({
        message: payload.content,
        title: 'Notification',
        entityType: payload.entityType,
        entityId: payload.entityId,
        traceId: notificationEntityId,
        subEntity: payload.payload?.subEntity,
        subEntityId: payload.payload?.subEntityId,
        entity: payload?.entity,
        module: payload?.module,
        navigationMeta: payload?.navigationMeta
      });

    } catch (e) {
      this.logger.error('Invalid JSON payload received', e);
    }
  }

  ngOnDestroy(): void {
    this.logger.debug('AppComponent Destroyed: Cleaning up SSE');
    this.sseSubscription?.unsubscribe();
    this.sseSubscription = undefined;
  }
}
