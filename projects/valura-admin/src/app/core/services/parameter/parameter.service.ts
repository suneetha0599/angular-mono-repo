import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { RiskParameter } from '@admin-page/data-discovery/bpa-listing/create-bpa/risk-summary-screen/models/risk-summary-model';

@Injectable({
  providedIn: 'root'
})
export class ParameterService {

  parameterMasterList: RiskParameter[] = []

  constructor() { }


  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getParameterMasterList(forceLoad: boolean = false) {
    let parameterList = await this.dbService.getAllParameters();

    if (forceLoad || !parameterList?.length) {
      const res = await this.downloadConfigService.getParametersList();
      let _parameterList = await this.dbService.getAllParameters();
      parameterList = [..._parameterList]
    }
    this.parameterMasterList = [...parameterList]
    return parameterList ?? [];
  }

  async addParameter(parameter: RiskParameter) {
    await this.dbService.addParameter(parameter);
  }

  createParameterObj(parameter: RiskParameter) {
    const newParameter: RiskParameter = {
      ...parameter
    };
    return newParameter
  }

  async createAndNewParameter(parameter: RiskParameter) {
    const newParameter = this.createParameterObj(parameter)
    await this.addParameter(newParameter);
    return newParameter
  }


  async updateParameterToDb(parameter: RiskParameter) {

  }

  async deleterParameter(parameterId: number) {

  }
}

