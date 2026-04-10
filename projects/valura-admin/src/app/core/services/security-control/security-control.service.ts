import { inject, Injectable } from '@angular/core';
import { SecurityControl } from '@admin-core/models/configuration/regulation';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';

@Injectable({
  providedIn: 'root'
})
export class SecurityControlService {

  securityControlMasterList: SecurityControl[] = []

  constructor() { }


  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getSecurityControlMasterList(forceLoad: boolean = false) {
    let securityControlList = await this.dbService.getAllSecurityControls();

    if (forceLoad || !securityControlList?.length) {
      const res = await this.downloadConfigService.getSecurityControlMasterList();
      let _securityControlList = await this.dbService.getAllSecurityControls();
      securityControlList = [..._securityControlList]
    }

    this.securityControlMasterList = [...securityControlList]
    return securityControlList ?? []
  }

  async addSecurityControl(securityControl: SecurityControl) {
    await this.dbService.addNewSecurityControl(securityControl);
  }

  createSecurityControlObj(securityControl: SecurityControl) {
    const newRegulation: SecurityControl = {
      ...securityControl
    };
    return newRegulation
  }

  async createAndNewSecurityControl(securityControl: SecurityControl) {
    const newParameter = this.createSecurityControlObj(securityControl)
    await this.addSecurityControl(newParameter);
    return newParameter
  }


  async updateSecurityControlToDb(securityControl: SecurityControl) {

  }

  async deleteSecurityControl(securityId: number) {
    await this.dbService.deleteSecurityControl(securityId);
  }
}