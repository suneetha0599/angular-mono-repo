import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { LegalBasis } from '@admin-core/models/configuration/regulation';

@Injectable({
  providedIn: 'root'
})
export class LegalGroundService {
  legalGroundMasterList: LegalBasis[] = []

  constructor() { }

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getPdElementMasterList(forceLoad: boolean = false): Promise<LegalBasis[]> {
    let legalGroundList = await this.dbService.getAllLegalBasis();

    if (forceLoad || !legalGroundList?.length) {
      await this.downloadConfigService.getLegalBasis();
      let _legalGroundList = await this.dbService.getAllLegalBasis();
      legalGroundList = [..._legalGroundList];
    }

    this.legalGroundMasterList = [...legalGroundList];
    return legalGroundList ?? [];
  }

  async getLegalGroundById(legalGroundId: number) {
    const legalBasis = await this.dbService.getLegalBasisById(legalGroundId);
    return legalBasis
  }

}
