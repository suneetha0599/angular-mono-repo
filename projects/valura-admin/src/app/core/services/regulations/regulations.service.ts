import { inject, Injectable } from '@angular/core';
import { Regulation, RegulationRight } from '@admin-core/models/configuration/regulation';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';

@Injectable({
  providedIn: 'root'
})
export class RegulationsService {

  regulationMasterList: Regulation[] = []

  rightsMasterList: RegulationRight[] = []

  constructor() { }


  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getRegulationMasterList(
    forceLoad: boolean = false,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ) {
    let regulationList = await this.dbService.getAllRegulations();

    if (forceLoad || !regulationList?.length) {
      let _regulationList = await this.dbService.getAllRegulations();
      regulationList = [..._regulationList]
    }

    let filtered = [...regulationList];

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

    this.regulationMasterList = [...filtered];
    return { acts: filtered };
  }

  async getRightsMasterList(
    regulationId: number,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ) {
    const { sortBy, sortDirection, searchText } = filters;

    let rightList = await this.dbService.getRightsByActId(regulationId) || [];

    if (searchText && searchText.trim()) {
      const text = searchText.trim().toLowerCase();

      rightList = rightList.filter((right: any) =>
        (right.name ?? "").toLowerCase().includes(text) ||
        (right.displayName ?? "").toLowerCase().includes(text) ||
        (right.rightTitle ?? "").toLowerCase().includes(text)
      );
    }

    if (sortBy) {
      rightList = rightList.sort((a: any, b: any) => {
        const aValue = (a[sortBy] ?? "").toString().toLowerCase();
        const bValue = (b[sortBy] ?? "").toString().toLowerCase();

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    this.rightsMasterList = rightList;
    return rightList;
  }

  async getRightByActId(regulationId: number) {
    let rightList = await this.dbService.getRightsByActId(regulationId) || [];
    return rightList
  }

  async getAllRights(forceLoad: boolean = false) {
    let rightList = await this.dbService.getAllRights();

    if (forceLoad || !rightList?.length) {
      const res = await this.downloadConfigService.getRightsList();
      let _rightList = await this.dbService.getAllRights();
      rightList = [..._rightList]
    }

    this.rightsMasterList = [...rightList]
    return rightList ?? []
  }

  async addRightItem(rightData: RegulationRight) {
    await this.dbService.addRight(rightData);
  }

  async deleteRight(rightId: number) {
    await this.dbService.deleteRight(rightId);
  }

  async updateRight(rightId: number, rightDetail: any) {
    let tempRightDetail = null;
    tempRightDetail = await this.dbService.getRightsById(rightId);
    const rightDetails = { ...tempRightDetail, ...rightDetail }
    const updated = await this.dbService.updateRight(rightId, rightDetails);
    return
  }

  async getRegulationById(id: number) {
    let regulation = null;

    regulation = await this.dbService.getRegulationById(id);
    if (regulation) {
      return regulation
    }

    return regulation
  }

  async addRegulation(regulation: Regulation) {
    await this.dbService.addRegulation(regulation);
  }

  createRegulationObj(regulation: Regulation) {
    const newRegulation: Regulation = {
      ...regulation
    };
    return newRegulation
  }

  async createAndNewRegulation(regulation: Regulation) {
    const newParameter = this.createRegulationObj(regulation)
    await this.addRegulation(newParameter);
    return newParameter
  }

  async updateRegulation(regulationId: number, regulationDetail: any) {
    let tempRegulationDetail = null;
    tempRegulationDetail = await this.dbService.getRegulationById(regulationId);
    const _regulationDetails = { ...tempRegulationDetail, ...regulationDetail }
    const updated = await this.dbService.updateRegulation(regulationId, _regulationDetails);
    return
  }

  async deleteRegulation(regulationId: number) {
    await this.dbService.deleteRegulation(regulationId);
  }

  async getRightById(id: number) {
    let right = null;
    right = await this.dbService.getRightsById(id);
    if (right) {
      return right
    }
    return right
  }

}
