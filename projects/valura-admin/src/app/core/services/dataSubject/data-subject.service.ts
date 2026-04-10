import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { DataSubject } from '@admin-core/models/configuration/regulation';

@Injectable({
  providedIn: 'root'
})
export class DataSubjectService {

  constructor() { }
  dataSubject!: DataSubject[];

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getDatasubjectMasterList(forceLoad: boolean = false,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}) {
    let dataSubjectList = await this.dbService.getAllDatasubject();
    if (forceLoad || !dataSubjectList) {
      let _dataSubjectList = await this.dbService.getAllDatasubject();
      dataSubjectList = [..._dataSubjectList]
    }

    let filtered = [...dataSubjectList]

    if (filters.searchText && filters.searchText.trim() !== '') {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(r => r.name?.toLowerCase().includes(search));
    }


    if (filters.sortBy) {
      const key = filters.sortBy;
      const dir = filters.sortDirection === 'desc' ? -1 : 1;

      filtered.sort((a: any, b: any) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        return String(valA).localeCompare(String(valB)) * dir;
      });
    }

    let dataSubjectMasterList = [...filtered];
    return dataSubjectMasterList;

  }

  async addDatasubject(dataSubject: DataSubject) {
    await this.dbService.addDataSubject(dataSubject);
  }

  createDatasubjectObj(dataSubject: DataSubject) {
    const newDataSubject: DataSubject = {
      ...dataSubject
    };
    return newDataSubject
  }

  async createAndNewDataSubject(dataSubject: DataSubject) {
    const newDataSubject = this.createDatasubjectObj(dataSubject)
    await this.addDatasubject(newDataSubject);
    return newDataSubject
  }

  async updateDatasubjectToDb(dataSubjectId: number, dataSubjectDetails: any) {
    let tempDataSubjectDetail = null;
    tempDataSubjectDetail = await this.dbService.getDataSubjectById(dataSubjectId);
    if (tempDataSubjectDetail) {
      const _DataSubjectDetail = { ...tempDataSubjectDetail, ...dataSubjectDetails }
      const updated = await this.dbService.updateDatasubject(dataSubjectId, _DataSubjectDetail);
      return
    }
  }

  async deletDataSubject(datasubjectId: number) {
    await this.dbService.deletDataSubject(datasubjectId);
  }

  async getDataSubjectById(dataSubjectId: number) {
    const dataSubject = await this.dbService.getDataSubjectById(dataSubjectId);
    return dataSubject
  }
}

