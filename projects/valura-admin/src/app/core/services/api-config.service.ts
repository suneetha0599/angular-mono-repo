import { Injectable } from '@angular/core';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LSK_API_URL_KEY } from '@admin-core/constants/local-storage-constants';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {

  defaultServerUrl: string = environment.api + environment.subApi;
  _serverUrl: string = ''

  public apiEndpointUpdate$: BehaviorSubject<string> = new BehaviorSubject('');

  constructor() {
    // this.apiEndpointUpdate$.subscribe(apiDomain => {
    //   if (apiDomain) {
    //     this._serverUrl = apiDomain
    //   }
    // });
  }

  setApiEndPoint(apiDomain: any) {
    setItem(LSK_API_URL_KEY, apiDomain);
    if (apiDomain) {
      this._serverUrl = apiDomain
    }
    // this.apiEndpointUpdate$.next(apiDomain)
  }


  get apiEndPoint(): any | null {
    return getItem(LSK_API_URL_KEY)
  }

  get serverUrl(): string {
    if (this._serverUrl) {
      return this._serverUrl
    }
    else if (this.apiEndPoint) {
      return this.apiEndPoint
    }
    else {
      return this.defaultServerUrl
    }
  }

  clearApiEndPoint() {
    removeItem(LSK_API_URL_KEY);
    this._serverUrl = this.defaultServerUrl
  }
}
