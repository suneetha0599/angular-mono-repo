import { inject, Injectable } from '@angular/core';
import { SYNC_STATUS } from '@admin-core/constants/api-constants';
import { AuthService } from '../auth.service';
import { ApiHelperService } from '../network/api-helper.service';
import { ApiConfigService } from '@admin-core/services/api-config.service';

enum state {
  INIT = "INIT",
  STOP = "STOP",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UPDATE_TOKEN = "UPDATE_TOKEN",
  UPDATE_DB = "UPDATE_DB",
  FORCE_SYNC = "FORCE_SYNC"
}

@Injectable({
  providedIn: 'root'
})
export class DataSyncService {

  private dataSyncWorker: Worker | null = null;
  SYNC_STATUS_API_URL = SYNC_STATUS;

  private authService = inject(AuthService);
  private apiHelperService = inject(ApiHelperService);
  private apiConfigService = inject(ApiConfigService);

  constructor() {
    this.authService.tokenUpdateSubject$.subscribe(token => {
      if (token) {
        this.updateToken(token);
      }
    });
  }

  startSync(forceSync: boolean = false) {
    if (!this.authService.isLoggedIn || this.authService.isInternalUser || this.authService.isExternalUser || this.authService.authUser) {
      return
    }
    if (typeof Worker !== 'undefined') {
      this.dataSyncWorker = new Worker(new URL('./data-sync.worker', import.meta.url));
      const data = {
        type: forceSync ? state.FORCE_SYNC : state.INIT,
        apiUrl: `${this.apiConfigService.serverUrl}`,
        queryUrl: `${this.SYNC_STATUS_API_URL}`,
        token: this.authService.getAuthToken(),
        configurationVersion: this.authService.getConfigVersion(),
      }
      this.dataSyncWorker.postMessage(data);

      this.dataSyncWorker.onmessage = ({ data }) => {
        if (data.type === state.UPDATE_DB) {
          const newVersion = data.payload.configurationVersion;
          const oldVersion = this.authService.getConfigVersion();
          if (newVersion !== oldVersion) {
            this.authService.setConfigVersion(newVersion)
          }
        }
        if (data.type === state.TOKEN_EXPIRED) {  //Note :  don't comment this condition
          this.getNotificationCount()
        }
      };
    }
  }

  stopSync() {
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
}

