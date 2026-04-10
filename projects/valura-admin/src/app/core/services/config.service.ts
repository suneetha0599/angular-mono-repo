import { inject, Injectable } from '@angular/core';
import { LSK_DSR_CONFIGURATION_LIST } from '@admin-core/constants/local-storage-constants';
import { getItem, setItem } from '@valura-lib/utils/local-storage-util';
import { DsrConfiguration } from '../models/DsrConfiguration';
import { BehaviorSubject, } from 'rxjs';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  dsrConfiguration!: DsrConfiguration
  configLoading: boolean = false;

  public onRouteAction$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private configApiHelperService = inject(ConfigApiHelperService);

  async getDsrConfiguration(forceLoad: boolean = false) {
    let dsrConfiguration = getItem(LSK_DSR_CONFIGURATION_LIST)

    if (!forceLoad && dsrConfiguration) {
      this.dsrConfiguration = new DsrConfiguration(dsrConfiguration)
      return dsrConfiguration
    }

    const res = await this.configApiHelperService.getDsrConfiguration();

    if (res) {
      this.dsrConfiguration = new DsrConfiguration(res)
      setItem(LSK_DSR_CONFIGURATION_LIST, (res ?? null))
    }
    return res ?? null
  }
}
