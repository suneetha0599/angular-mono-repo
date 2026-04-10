import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { Declaration } from '@admin-core/models/configuration/regulation';

@Injectable({
  providedIn: 'root'
})
export class DeclarationService {

  declarationMasterList: Declaration[] = []

  constructor() { }

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getDeclarationMasterList(forceLoad: boolean = false): Promise<Declaration[]> {
    let declarationList = await this.dbService.getAllDeclarations();

    if (forceLoad || !declarationList?.length) {
      await this.downloadConfigService.getDeclarationList();
      let _declarationList = await this.dbService.getAllDeclarations();
      declarationList = [..._declarationList];
    }

    this.declarationMasterList = [...declarationList];
    return declarationList ?? [];
  }

  async getDeclarationList(
    regulationId: number,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ) {
    const { sortBy, sortDirection, searchText } = filters;

    let declarationList = await this.dbService.getDeclarationByActId(regulationId) || [];

    if (searchText && searchText.trim()) {
      const text = searchText.trim().toLowerCase();

      declarationList = declarationList.filter((right: any) =>
        (right.name ?? "").toLowerCase().includes(text) ||
        (right.displayName ?? "").toLowerCase().includes(text) ||
        (right.rightTitle ?? "").toLowerCase().includes(text)
      );
    }

    if (sortBy) {
      declarationList = declarationList.sort((a: any, b: any) => {
        const aValue = (a[sortBy] ?? "").toString().toLowerCase();
        const bValue = (b[sortBy] ?? "").toString().toLowerCase();

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    this.declarationMasterList = declarationList;
    return declarationList;
  }

  async addDeclaration(declaration: Declaration) {
    await this.dbService.addDeclaration(declaration);
  }

  async addBulkDeclarations(declarations: Declaration[]): Promise<number> {
    return this.dbService.addBulkDeclaration(declarations);
  }

  async getDeclarationById(declarationId: number) {
    const declaration = await this.dbService.getDeclarationById(declarationId);
    return declaration
  }

  createDeclarationObj(declaration: Declaration): Declaration {
    const newDeclaration: Declaration = {
      ...declaration
    };
    return newDeclaration;
  }

  async createAndNewDeclaration(declaration: Declaration) {
    const newDeclaration = this.createDeclarationObj(declaration)
    await this.addDeclaration(newDeclaration);
    return newDeclaration
  }

  async updateDeclarationToDb(declarationId: number, declarationDetails: any) {
    const updated = await this.dbService.updateDeclaration(declarationId, declarationDetails);
    return updated;
  }

  async createAndAddDeclaration(declaration: Declaration): Promise<Declaration> {
    const newDeclaration = this.createDeclarationObj(declaration);
    await this.addDeclaration(newDeclaration);
    return newDeclaration;
  }

  async deleteDeclaration(declarationId: number) {
    await this.dbService.deleteDeclaration(declarationId);
  }

  async getDeclarationsByEntity(
    entityType: string,
    actId: number,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ) {
    const { sortBy, sortDirection, searchText } = filters;

    let declarationList = await this.dbService.getDeclarationsByEntity(entityType, actId) || [];

    if (searchText && searchText.trim()) {
      const text = searchText.trim().toLowerCase();

      declarationList = declarationList.filter((declaration: any) =>
        (declaration.declaration ?? "").toLowerCase().includes(text) ||
        (declaration.type ?? "").toLowerCase().includes(text)
      );
    }

    if (sortBy) {
      declarationList = declarationList.sort((a: any, b: any) => {
        const aValue = (a[sortBy] ?? "").toString().toLowerCase();
        const bValue = (b[sortBy] ?? "").toString().toLowerCase();

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    this.declarationMasterList = declarationList;
    return declarationList;
  }

  async getDeclarationsByEntityType(
    entityType: string,
    actId: number,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ) {
    const { sortBy, sortDirection, searchText } = filters;

    let declarationList = await this.dbService.getDeclarationsByEntityType(entityType, actId) || [];

    if (searchText && searchText.trim()) {
      const text = searchText.trim().toLowerCase();

      declarationList = declarationList.filter((declaration: any) =>
        (declaration.declaration ?? "").toLowerCase().includes(text) ||
        (declaration.type ?? "").toLowerCase().includes(text)
      );
    }

    if (sortBy) {
      declarationList = declarationList.sort((a: any, b: any) => {
        const aValue = (a[sortBy] ?? "").toString().toLowerCase();
        const bValue = (b[sortBy] ?? "").toString().toLowerCase();

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    this.declarationMasterList = declarationList;
    return declarationList;
  }

  async getDeclarationsByEntityId(entityType: string, entityId: number) {
    let declarationList = await this.dbService.getDeclarationsByEntityId(entityType, entityId) || [];
    return declarationList;
  }

  async getDeclarationsByActId(actId: number) {
    let declarationList = await this.dbService.getDeclarationsByActId(actId) || [];
    return declarationList;
  }
}
