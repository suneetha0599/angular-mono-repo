import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { LegalBasis } from '@admin-core/models/configuration/regulation';

@Injectable({
  providedIn: 'root'
})
export class LegalBasisService {

  legalBasisMasterList: LegalBasis[] = []

  constructor() { }

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getLegalBasisMasterList(forceLoad: boolean = false): Promise<LegalBasis[]> {
    let legalBasisList = await this.dbService.getAllLegalBasis();

    if (forceLoad || !legalBasisList?.length) {
      await this.downloadConfigService.getLegalBasis();
      let _legalBasisList = await this.dbService.getAllLegalBasis();
      legalBasisList = [..._legalBasisList];
    }

    this.legalBasisMasterList = [...legalBasisList];
    return legalBasisList ?? [];
  }

  async addLegalBasis(legalBasis: LegalBasis) {
    await this.dbService.addLegalBasis(legalBasis);
  }

  async addBulkLegalBasis(legalBasis: LegalBasis[]): Promise<number> {
    return this.dbService.addBulkLegalBasis(legalBasis);
  }

  async getLegalBasisById(legalBasisId: number) {
    const legalBasis = await this.dbService.getLegalBasisById(legalBasisId);
    return legalBasis
  }

  createLegalBasisObj(legalBasis: LegalBasis): LegalBasis {
    const newLegalBasis: LegalBasis = {
      ...legalBasis
    };
    return newLegalBasis;
  }

  async createAndNewLegalBasis(legalBasis: LegalBasis) {
    const newLegalBasis = this.createLegalBasisObj(legalBasis)
    await this.addLegalBasis(newLegalBasis);
    return newLegalBasis
  }

  async updateLegalBasisToDb(legalBasisId: number, legalBasisDetails: any) {
    let tempLegalBasisDetail = null;
    tempLegalBasisDetail = await this.dbService.getLegalBasisById(legalBasisId);
    if (tempLegalBasisDetail) {
      const _legalBasisDetail = { ...tempLegalBasisDetail, ...legalBasisDetails }
      const updated = await this.dbService.updateLegalBasis(legalBasisId, _legalBasisDetail);
      return
    }
  }

  async createAndAddLegalBasis(legalBasis: LegalBasis): Promise<LegalBasis> {
    const newLegalBasis = this.createLegalBasisObj(legalBasis);
    await this.addLegalBasis(newLegalBasis);
    return newLegalBasis;
  }

  async deleteLegalBasis(legalBasisId: number) {
    await this.dbService.deleteLegalBasis(legalBasisId);
  }

  async getLegalBasisByActId(
    actId: number,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ) {
    const { sortBy, sortDirection, searchText } = filters;

    let legalBasisList = await this.dbService.getLegalBasisByActId(actId) || [];
    if (searchText && searchText.trim()) {
      const text = searchText.trim().toLowerCase();

      legalBasisList = legalBasisList.filter((legalBasis: any) =>
        (legalBasis.name ?? "").toLowerCase().includes(text) ||
        (legalBasis.description ?? "").toLowerCase().includes(text) ||
        (legalBasis.provision ?? "").toLowerCase().includes(text)
      );
    }

    if (sortBy) {
      legalBasisList = legalBasisList.sort((a: any, b: any) => {
        const aValue = (a[sortBy] ?? "").toString().toLowerCase();
        const bValue = (b[sortBy] ?? "").toString().toLowerCase();

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    this.legalBasisMasterList = legalBasisList;
    return legalBasisList;
  }

  async replaceLegalBasisForActId(actId: number, legalBasisList: LegalBasis[]): Promise<void> {
    await this.dbService.replaceLegalBasisForActId(actId, legalBasisList);
  }
}
