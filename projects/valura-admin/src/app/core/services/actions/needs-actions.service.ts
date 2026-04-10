import { inject, Injectable } from '@angular/core';
import { NEEDS_ACTIONS } from '@admin-core/constants/api-constants';
import { AuthService } from '../auth.service';
import { ApiHelperService } from '../network/api-helper.service';
import { FeatureService } from '../feature.service';
import { ApiConfigService } from '@admin-core/services/api-config.service';

enum state {
  INIT = "INIT",
  STOP = "STOP",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UPDATE_TOKEN = "UPDATE_TOKEN",
}

@Injectable({
  providedIn: 'root'
})

export class NeedsActionsService {

  private dataSyncWorker: Worker | null = null;
  NEEDS_ACTIONS_API_URL = NEEDS_ACTIONS;

  private authService = inject(AuthService);
  private apiHelperService = inject(ApiHelperService);
  private featureService = inject(FeatureService);
  private apiConfigService = inject(ApiConfigService);

  constructor() {
    this.authService.tokenUpdateSubject$.subscribe(token => {
      if (token) {
        this.updateToken(token);
      }
    });
  }

  start() {
    if (!this.authService.isLoggedIn || this.authService.isInternalUser || this.authService.isExternalUser || this.authService.authUser) {
      return
    }
    if (typeof Worker !== 'undefined') {
      this.dataSyncWorker = new Worker(new URL('./needs-action.worker', import.meta.url));
      const data = {
        type: state.INIT,
        apiUrl: `${this.apiConfigService.serverUrl}`,
        queryUrl: `${this.NEEDS_ACTIONS_API_URL}`,
        token: this.authService.getAuthToken(),
      }
      this.dataSyncWorker.postMessage(data);

      this.dataSyncWorker.onmessage = ({ data }) => {
        if (data.type === state.SUCCESS) {
          this.updateActionToFeature(data.data)
        }
        // if (data.type === state.TOKEN_EXPIRED) {
        //   this.getNotificationCount()
        // }
      };
    }
  }

  stop() {
    this.dataSyncWorker?.postMessage({ type: state.STOP });
    this.dataSyncWorker?.terminate();
    this.dataSyncWorker = null;
  }

  updateToken(newToken: string) {
    if (this.dataSyncWorker) {
      this.dataSyncWorker.postMessage({ type: state.UPDATE_TOKEN, token: newToken });
    }
  }

  async getNotificationCount() {
    try {
      const res = await this.apiHelperService.getUnreadNotificationCount();
      if (res) {
        const token = this.authService.getAuthToken();
        this.updateToken(token)
      }
    }
    catch (e) {
      console.error(e)
    }
  }

  updateActionToFeature(data: any) {
    this.featureService.actionItems = [];
    if (data?.data) {
      this.featureService.actionItems = (data?.data ?? []);
    }
    this.featureService.updateActionToFeature()
  }
}

