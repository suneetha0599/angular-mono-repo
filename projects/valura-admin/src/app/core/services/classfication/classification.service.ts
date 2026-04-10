import { inject, Injectable } from '@angular/core';
import { Classfication } from '@admin-core/models/configuration/regulation';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';

@Injectable({
  providedIn: 'root'
})
export class ClassificationService {

  constructor() { }

  classficationMasterList!: Classfication[];

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getClassificationMasterList(forceLoad: boolean = false) {
    let classficationMasterList = await this.dbService.getAllClassification();
    if (forceLoad || !classficationMasterList) {
      const res = await this.downloadConfigService.getClassificationList();
      let classficationList = await this.dbService.getAllClassification();
      classficationMasterList = [...classficationList]
    }
    this.classficationMasterList = [...classficationMasterList]
    return classficationMasterList ?? []
  }

  async addClassfication(classfication: Classfication) {
    await this.dbService.addClassification(classfication);
  }
}
