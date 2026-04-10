import { inject, Injectable } from '@angular/core';
import { PdCategory } from '@admin-core/models/configuration/regulation';
import { DbService } from '@admin-core/services/db/db.service';
import { DownloadConfigService } from '@admin-core/services/download/download-config.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor() { }

  PdCategory!: PdCategory[];

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getPdCategoryMasterList(forceLoad: boolean = false) {
    let PdCategoryMasterList = await this.dbService.getAllPdCategory();
    if (forceLoad || !PdCategoryMasterList) {
      const res = await this.downloadConfigService.getPdCategoryList();
      let PdCategoryList = await this.dbService.getAllPdCategory();
      PdCategoryMasterList = [...PdCategoryList]
    }
    this.PdCategory = [...PdCategoryMasterList]
    return PdCategoryMasterList ?? []
  }

  async addPdCategory(PdCategory: PdCategory) {
    await this.dbService.addPdCategory(PdCategory);
  }

  createPdCategoryObj(PdCategory: PdCategory) {
    const newPdCategory: PdCategory = {
      ...PdCategory
    };
    return newPdCategory
  }

  async createAndNewPdCategory(PdCategory: PdCategory) {
    const newPdCategory = this.createPdCategoryObj(PdCategory)
    await this.addPdCategory(newPdCategory);
    return newPdCategory
  }

  async updatePdCategoryToDb(PdCategoryId: number, PdCategoryDetails: any) {
    let tempPdCategoryDetail = null;
    tempPdCategoryDetail = await this.dbService.getPdCategoryById(PdCategoryId);
    if (tempPdCategoryDetail) {
      const _PdCategoryDetail = { ...tempPdCategoryDetail, ...PdCategoryDetails }
      const updated = await this.dbService.updatePdCategory(PdCategoryId, _PdCategoryDetail);
      return
    }
  }

  async deletPdCategory(PdCategoryId: number) {
    await this.dbService.deletPdCategory(PdCategoryId);
  }
}
