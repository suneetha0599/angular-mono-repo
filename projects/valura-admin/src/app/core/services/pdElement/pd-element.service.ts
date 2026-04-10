// pd-element.service.ts
import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { PdElements, PdCategory, Classfication } from '@admin-core/models/configuration/regulation';

@Injectable({
  providedIn: 'root'
})
export class PdElementService {

  pdElementMasterList: PdElements[] = []

  PdElementCategoryList: PdCategory[] = []

  ClassficationList: Classfication[] = []

  constructor() { }

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getPdElementMasterList(forceLoad: boolean = false): Promise<PdElements[]> {
    let pdElementList = await this.dbService.getAllPdElements();

    if (forceLoad || !pdElementList?.length) {
      await this.downloadConfigService.getPdElementList();
      let _pdElementList = await this.dbService.getAllPdElements();
      pdElementList = [..._pdElementList];
    }

    this.pdElementMasterList = [...pdElementList];
    return pdElementList ?? [];
  }

  async getCategory(forceLoad: boolean = false): Promise<PdCategory[]> {
    let PdCategoryList = await this.dbService.getAllPdCategory();

    if (forceLoad || !PdCategoryList?.length) {
      await this.downloadConfigService.getPdCategoryList();
      let _pdCategoryList = await this.dbService.getAllPdCategory();
      PdCategoryList = [..._pdCategoryList];
    }

    this.PdElementCategoryList = [...PdCategoryList];
    return PdCategoryList ?? [];
  }

  async getClassification(forceLoad: boolean = false): Promise<Classfication[]> {
    let ClassficationList = await this.dbService.getAllClassification();

    if (forceLoad || !ClassficationList?.length) {
      await this.downloadConfigService.getPdCategoryList();
      let _pdClassficationList = await this.dbService.getAllClassification();
      ClassficationList = [..._pdClassficationList];
    }

    this.ClassficationList = [...ClassficationList];
    return ClassficationList ?? [];
  }

  async addPdElement(pdElement: PdElements) {
    await this.dbService.addPdElement(pdElement);
  }

  async addBulkPdElements(pdElements: PdElements[]): Promise<number> {
    return this.dbService.addBulkPdElements(pdElements);
  }

  async getPdElementById(pdElementId: number) {
    const dataSubject = await this.dbService.getPdElementsById(pdElementId);
    return dataSubject
  }

  createPdElementObj(pdElement: PdElements): PdElements {
    const newPdElement: PdElements = {
      ...pdElement
    };
    return newPdElement;
  }

  async createAndNewpdElement(pdElement: PdElements) {
    const newpdElement = this.createPdElementObj(pdElement)
    await this.addPdElement(newpdElement);
    return newpdElement
  }

  async updatePdElementToDb(pdElementId: number, pdElementDetails: any) {
    let temppdElementDetail = null;
    temppdElementDetail = await this.dbService.getPdElementsById(pdElementId);
    if (temppdElementDetail) {
      const _pdElementDetail = { ...temppdElementDetail, ...pdElementDetails }
      const updated = await this.dbService.updatePdElement(pdElementId, _pdElementDetail);
      return
    }
  }

  async createAndAddPdElement(pdElement: PdElements): Promise<PdElements> {
    const newPdElement = this.createPdElementObj(pdElement);
    await this.addPdElement(newPdElement);
    return newPdElement;
  }

  async updatepdElementToDb(pdElementId: number, pdElementDetails: any) {
    let temppdElementDetail = null;
    temppdElementDetail = await this.dbService.getPdElementsById(pdElementId);
    if (temppdElementDetail) {
      const _pdElementDetail = { ...temppdElementDetail, ...pdElementDetails }
      const updated = await this.dbService.updatePdElement(pdElementId, _pdElementDetail);
      return
    }
  }

  async updatepdCategory(pdCategoryId: number, pdCategoryDetails: any) {
    let temppdElementDetail = null;
    temppdElementDetail = await this.dbService.getPdCategoryById(pdCategoryId);
    if (temppdElementDetail) {
      const _pdCategoryDetail = { ...temppdElementDetail, ...pdCategoryDetails }
      const updated = await this.dbService.updatePdCategory(pdCategoryId, _pdCategoryDetail);
      return
    }
  }

  async updatepdClassfication(pdClassficationId: number, pdClassficationDetails: any) {
    let temppdElementDetail = null;
    temppdElementDetail = await this.dbService.getClassificationById(pdClassficationId);
    if (temppdElementDetail) {
      const _pdClassficationDetail = { ...temppdElementDetail, ...pdClassficationDetails }
      const updated = await this.dbService.updateClassfication(pdClassficationId, _pdClassficationDetail);
      return
    } 1
  }

  async deletPdElement(pdElementId: number) {
    await this.dbService.deletPdElement(pdElementId);
  }

  async deletPdCategory(pdElementId: number) {
    await this.dbService.deletPdCategory(pdElementId);
  }

  async deletClassfication(ClassficationId: number) {
    await this.dbService.deletClassfication(ClassficationId);
  }

  async getPdElementByCategoryId(categoryId: number) {
    let pdElementList = await this.dbService.getPdElementsByCategoryId(categoryId);
    return pdElementList;
  }
}
