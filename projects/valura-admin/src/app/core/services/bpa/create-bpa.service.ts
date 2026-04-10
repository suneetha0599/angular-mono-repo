import { inject, Injectable } from '@angular/core';
import { AssetPdElementMapping, BpaDataSubject, DataSubjectPdElemementMapping, PdElement, PdElementMapping, PdElementMappingResponse, Purpose, RecipientPdElementMapping, SourcetPdElementMapping } from '@admin-core/models/data-inventory/BPA';
import { Department } from '@admin-core/models/department-management/department.model';
import { DataSubjectService } from '../dataSubject/data-subject.service';
import { PdElementService } from '../pdElement/pd-element.service';
import { buildDataSubjectMapping, prepareAssetMappingDataPayload, prepareAssetPdMappingPayload, prepareBpaPurposeMappingDataPayload, prepareDataSubjectMappingDataPayload, preparePdMappingDataPayload, prepareRecepientMappingDataPayload, prepareRecepientPdMappingPayload, prepareRegionMappingDataPayload, prepareSourceMappingDataPayload, prepareSourcePdMappingPayload } from @admin - page / data - discovery / bpa - listing / bpa - utils';
import { FormBuilder } from '@angular/forms';
import { BpaService } from './bpa.service';
import { Recipient } from @admin - page / data - discovery / bpa - listing / constants';
import { DataSyncService } from '../download/data-sync.service';
import { LegalGroundService } from '../legal-ground/legal-ground.service';
import { RegulationsService } from '../regulations/regulations.service';
import { CountryService } from '../country/country.service';
import { AssetBpaMappingPayload, AssetPdMappingPayload, BpaUpdatePayload, DataSubjectTypeMappingPayload, PdMappingPayload, PurposeMappingPayload, RecipientBpaMappingPayload, RecipientPdMappingPayload, RegionMappingPayload, SourceBpaMappingPayload, SourcePdMappingPayload } from '@admin-core/models/data-inventory/BpaPayload';
import { DepartmentService } from '../department/department.service';
import { UserService } from '../user/user.service';
import { DownloadConfigService } from '../download/download-config.service';


@Injectable({
  providedIn: 'root'
})
export class CreateBpaService {

  newPdElementsList: PdElement[] = []
  newSourceList: any[] = []
  newAssetList: any[] = []
  newRecepientList: any[] = []
  newAssociatedDepartment: Department[] = [];
  newPurposesList: Purpose[] = [];
  bpaControllerList: any[] = [];
  newSecurityControlList: any[] = []
  deletedPdElementMappingList: PdMappingPayload[] = [];
  deletedSourceMappingList: SourceBpaMappingPayload[] = [];
  deletedAssetMappingList: AssetBpaMappingPayload[] = [];
  deletedRecepientMappingList: RecipientBpaMappingPayload[] = [];
  deletedAssociatedDepartment: any = [];
  deletedPurposesList: PurposeMappingPayload[] = [];
  deletedBpaControllerList: any = [];
  deletedRegionList: RegionMappingPayload[] = [];
  deletedDataSubjectTypeList: DataSubjectTypeMappingPayload[] = [];
  deletedSourcePdMappingList: SourcePdMappingPayload[] = [];
  deletedAssetPdMappingList: AssetPdMappingPayload[] = [];
  deletedRecipientPdMappingList: RecipientPdMappingPayload[] = [];


  private dataSyncService = inject(DataSyncService);
  private legalGroundService = inject(LegalGroundService);
  private regulationsService = inject(RegulationsService);
  private countryService = inject(CountryService);
  private departmentService = inject(DepartmentService);
  private userService = inject(UserService);
  private downloadConfigService = inject(DownloadConfigService);

  constructor(private fb: FormBuilder, private dataSubjectService: DataSubjectService, private pdElementService: PdElementService,) { }
  onCreateOrUpdatePdElement(result: any) {

    const originalCategoryMappings = result.originalCategoryMappings ?? [];
    const originalClassificationMappings = result.originalClassificationMappings ?? [];

    const categoryMappings = [
      ...originalCategoryMappings
        .filter((cm: { categoryId: any; }) => !result.categoryId.includes(cm.categoryId))
        .map((cm: { mappingId: any; categoryId: any; }) => ({
          mappingId: cm.mappingId,
          pdCategoryId: cm.categoryId,
          isDeleted: true
        })),

      ...result.categoryId.map((catId: number) => {
        const found = originalCategoryMappings.find((cm: { categoryId: number; }) => cm.categoryId === catId);
        return {
          mappingId: found?.mappingId ?? 0,
          pdCategoryId: catId,
          isDeleted: false
        };
      })
    ];

    const classificationMappings = [
      ...originalClassificationMappings
        .filter((cm: { classificationId: any; }) => !result.classificationId.includes(cm.classificationId))
        .map((cm: { mappingId: any; classificationId: any; }) => ({
          mappingId: cm.mappingId,
          classificationId: cm.classificationId,
          isDeleted: true
        })),

      ...result.classificationId.map((clsId: number) => {
        const found = originalClassificationMappings.find((cm: { classificationId: number; }) => cm.classificationId === clsId);
        return {
          mappingId: found?.mappingId ?? 0,
          classificationId: clsId,
          isDeleted: false
        };
      })
    ];

    const payload = {
      id: result.id,
      name: result.name,
      categoryMappings,
      classificationMappings,
      isUpdated: true
    };

    const index = this.newPdElementsList.findIndex(p => p.id === result.id);

    if (index > -1) {
      this.newPdElementsList[index] = payload;
    } else {
      this.newPdElementsList.push(payload);
    }
  }


  onCreateOrUpdateSource(result: any) {
    // if (result.sourceType) {
    //   result.type = result.sourceType;
    //   delete result.sourceType;
    // }
    const sourceIndex = this.newSourceList.findIndex(source => source.id == result?.id);
    if (sourceIndex > -1) {
      const sourceDetails = this.newSourceList[sourceIndex]
      this.newSourceList[sourceIndex] = { ...sourceDetails, ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newSourceList.push(result);
    }
  }

  onCreateOrUpdateAsset(result: any) {

    const assetIndex = this.newAssetList.findIndex(asset => asset.id == result?.id);
    if (assetIndex > -1) {
      this.newAssetList[assetIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newAssetList.push(result);
    }
  }

  onCreateOrUpdateRecepient(result: any) {

    const recepientIndex = this.newRecepientList.findIndex(recepient => recepient.id == result?.id);
    if (recepientIndex > -1) {
      this.newRecepientList[recepientIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newRecepientList.push(result);
    }
  }

  onCreateOrUpdateDepartment(result: any) {

    const deptIndex = this.newAssociatedDepartment.findIndex(dept => dept.id == result?.id);
    if (deptIndex > -1) {
      this.newAssociatedDepartment[deptIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newAssociatedDepartment.push(result);
    }
  }

  onCreateOrUpdateSecurityControl(result: any) {

    const SecurityControlIndex = this.newSecurityControlList.findIndex((control: { id: any; }) => control.id == result?.id);
    if (SecurityControlIndex > -1) {
      this.newSecurityControlList[SecurityControlIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newSecurityControlList.push(result);
    }
  }

  onCreateOrUpdatePurpose(result: any) {

    const purposeIndex = this.newPurposesList.findIndex(purpose => purpose.id == result?.id);
    if (purposeIndex > -1) {
      this.newPurposesList[purposeIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newPurposesList.push(result);
    }
  }

  onCreateOrUpdateController(result: any) {

    const controllerIndex = this.bpaControllerList.findIndex(controller => controller.id == result?.id);
    if (controllerIndex > -1) {
      this.bpaControllerList[controllerIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.bpaControllerList.push(result);
    }
  }

  /* Delete  */
  onDeletePdElement(dataSubject: BpaDataSubject, pdElementMapping: PdElementMapping) {
    if (!pdElementMapping) {
      return
    }

    if (typeof pdElementMapping?.pdElement?.id === "string") {
      const pdIndex = this.newPdElementsList.findIndex(pdEle => pdEle.id == pdElementMapping?.pdElement?.id);
      if (pdIndex > -1) {
        this.newPdElementsList.splice(pdIndex, 1)
      }
      return
    }
    if (pdElementMapping?.pdElement?.pdBpaMappingId) {
      const dsPdMapping = this.deletedPdElementMappingList.find(pdEle => pdEle.pdElementBpaMapping.pdElementBpaMappingId == pdElementMapping.pdElement?.pdBpaMappingId);
      if (!dsPdMapping) {
        const deletedData = preparePdMappingDataPayload(dataSubject, pdElementMapping, true);
        this.deletedPdElementMappingList.push(deletedData)
      }
    }
  }

  onDeleteSource(sourcetPdElementMapping: SourcetPdElementMapping) {
    if (typeof sourcetPdElementMapping.source?.id === "string") {
      const sourceIndex = this.newSourceList.findIndex(source => source.id == sourcetPdElementMapping.source?.id);
      if (sourceIndex > -1) {
        this.newSourceList.splice(sourceIndex, 1)
      }
      return
    }
    if (sourcetPdElementMapping.id) {
      const sourceMapping = this.deletedSourceMappingList.find(sourceMap => sourceMap.sourceBpaMapping.sourceBpaMappingId == sourcetPdElementMapping.id);
      if (!sourceMapping) {
        const deletedData = prepareSourceMappingDataPayload(sourcetPdElementMapping, true);
        this.deletedSourceMappingList.push(deletedData)
      }
    }
  }

  onDeleteAsset(assetPdElementMapping: AssetPdElementMapping) {
    if (typeof assetPdElementMapping.asset?.id === "string") {
      const assetIndex = this.newAssetList.findIndex(asset => asset.id == assetPdElementMapping.asset?.id);
      if (assetIndex > -1) {
        this.newAssetList.splice(assetIndex, 1)
      }
      return
    }
    if (assetPdElementMapping.id) {
      const assetMapping = this.deletedAssetMappingList.find(assetMap => assetMap.assetBpaMapping.assetBpaMappingId == assetPdElementMapping.id);
      if (!assetMapping) {
        const deletedData = prepareAssetMappingDataPayload(assetPdElementMapping, true);
        this.deletedAssetMappingList.push(deletedData)
      }
    }
  }

  onDeleteRecepient(recipientPdElementMapping: RecipientPdElementMapping) {
    if (typeof recipientPdElementMapping?.recipient?.id === "string") {
      const recepientIndex = this.newRecepientList.findIndex(recepient => recepient.id == recipientPdElementMapping?.recipient?.id);
      if (recepientIndex > -1) {
        this.newRecepientList.splice(recepientIndex, 1)
      }
      return
    }
    if (recipientPdElementMapping.id) {
      const assetMapping = this.deletedRecepientMappingList.find(recepientMap => recepientMap.recipientBpaMappingId == recipientPdElementMapping.id);
      if (!assetMapping) {
        const deletedData = prepareRecepientMappingDataPayload(recipientPdElementMapping, true);
        this.deletedRecepientMappingList.push(deletedData)
      }
    }
  }

  onDeletePurpose(purpose: Purpose) {
    if (typeof purpose.id === "string") {
      const purposeIndex = this.newPurposesList.findIndex(_purpose => _purpose.id == purpose?.id);
      if (purposeIndex > -1) {
        this.newPurposesList.splice(purposeIndex, 1)
      }
      return
    }
    if (purpose.id) {
      const purposeMapping = this.deletedPurposesList.find(_purpose => _purpose.bpaPurposeId == purpose.bpaPurposeMappingId);
      if (!purposeMapping) {
        const deletedData = prepareBpaPurposeMappingDataPayload(purpose, true);
        this.deletedPurposesList.push(deletedData)
      }
    }
  }

  onDeleteController(result: any) {
  }

  onDeleteRegion(region: any) {
    if (region.id) {
      const regionMapping = this.deletedRegionList.find(_region => _region.dsRegionBpaMappingId == region.dsRegionBpaMappingId);
      if (!regionMapping) {
        const deletedData = prepareRegionMappingDataPayload(region, true);
        this.deletedRegionList.push(deletedData)
      }
    }
  }

  onDeleteSourcePdElementMapping(sourcetPdElementMapping: SourcetPdElementMapping, pdElementMapping: PdElementMapping) {
    if (typeof pdElementMapping.pdElement?.id === "string") {
      return
    }
    if (pdElementMapping.pdElement?.id) {
      const sourcePdMapping = this.deletedSourcePdMappingList.find(_pdElementMapping => _pdElementMapping.pdElementBpaMappingId == pdElementMapping.pdElement?.pdBpaMappingId);
      if (!sourcePdMapping) {
        const deletedData = prepareSourcePdMappingPayload(sourcetPdElementMapping, pdElementMapping, true);
        this.deletedSourcePdMappingList.push(deletedData)
      }
    }
  }

  onDeleteAssetPdElementMapping(assetPdElementMapping: AssetPdElementMapping, pdElementMapping: PdElementMapping) {
    if (typeof pdElementMapping.pdElement?.id === "string") {
      return
    }
    if (pdElementMapping.pdElement?.id) {
      const assetPdMapping = this.deletedAssetPdMappingList.find(_pdElementMapping => _pdElementMapping.pdElementAssetMappingId == pdElementMapping.pdElement?.pdBpaMappingId);
      if (!assetPdMapping) {
        const deletedData = prepareAssetPdMappingPayload(assetPdElementMapping, pdElementMapping, true);
        this.deletedAssetPdMappingList.push(deletedData)
      }
    }
  }

  onDeleteRecepientPdElementMapping(recipientPdElementMapping: RecipientPdElementMapping, pdElementMapping: PdElementMapping) {
    if (typeof pdElementMapping.pdElement?.id === "string") {
      return
    }
    if (pdElementMapping.pdElement?.id) {
      const recepientPdMapping = this.deletedRecipientPdMappingList.find(_pdElementMapping => _pdElementMapping.pdElementRecipientMappingId == pdElementMapping.pdElement?.pdBpaMappingId);
      if (!recepientPdMapping) {
        const deletedData = prepareRecepientPdMappingPayload(recipientPdElementMapping, pdElementMapping, true);
        this.deletedRecipientPdMappingList.push(deletedData)
      }
    }
  }

  onDeleteDataSubjectType(dataSubjectType: BpaDataSubject) {
    if (dataSubjectType.id) {
      const dsMapping = this.deletedRegionList.find(_dataSubjectType => _dataSubjectType.dsRegionBpaMappingId == dataSubjectType.dsBpaMappingId);
      if (!dsMapping) {
        const deletedData = prepareDataSubjectMappingDataPayload(dataSubjectType, true);
        this.deletedDataSubjectTypeList.push(deletedData)
      }
    }
  }

  patchCreateBpaServiceDetails(data: any) {
    this.newPdElementsList = [...(data?.newPdElementsList ?? [])];
    this.newSourceList = [...(data?.newSourceList ?? [])];
    this.newAssetList = [...(data?.newAssetList ?? [])];
    this.newRecepientList = [...(data?.newRecepientList ?? [])];
    this.newAssociatedDepartment = [...(data?.newAssociatedDepartment ?? [])];
    this.newPurposesList = [...(data?.newPurposeList ?? [])];
    this.newSecurityControlList = [...(data?.newSecurityMeasuresList ?? [])];
  }

  preparePayloadForNewItems(isFinalSave: boolean = false) {
    const newPurposeList = [...this.newPurposesList]
    // .map((item: any) => { return { ...item, id: 0 } });
    const newAssociatedDepartment = [...this.newAssociatedDepartment]

    const newPdElementsList = [...this.newPdElementsList]
    const newSourceList = [...this.newSourceList]
    const newAssetList = [... this.newAssetList]
    const newRecepientList = [...this.newRecepientList]
    const newSecurityMeasuresList = this.newSecurityControlList.map((item: any) => {
      if (item.securityMeasureId && item.name) {
        return item;
      }

      return {
        securityMeasureId: item.id,
        name: item.name
      };
    });
    if (isFinalSave && newSourceList?.length) {
      newSourceList.map((item: any) => {
        if (item.tempSourceId) {
          item.id = item.tempSourceId;
        }
      });
    }

    return {
      newPurposeList,
      newAssociatedDepartment,
      newPdElementsList,
      newSourceList,
      newAssetList,
      newRecepientList,
      newSecurityMeasuresList,
    }
  }

  async prepareDataSubjectList(dataSubjectList: BpaDataSubject[]) {
    if (dataSubjectList?.length) {
      const _dsList = await Promise.all(
        dataSubjectList.map(async (ds: BpaDataSubject) => {
          const _dataSubject = await this.dataSubjectService.getDataSubjectById(ds?.id ?? 0);
          return {
            id: ds?.id ?? 0,
            name: ds?.name || _dataSubject?.name || '',
            dsBpaMappingId: ds?.dsBpaMappingId ?? 0,
          };
        })
      );
      return _dsList;
    }
    return [];
  }

  async _prepareDataSubjectMapping(dataSubjectPdElemementMapping: DataSubjectPdElemementMapping) {
    const _dataSubject = await this.dataSubjectService.getDataSubjectById(dataSubjectPdElemementMapping.dataSubjectType?.id ?? 0);
    dataSubjectPdElemementMapping.dataSubjectType = new BpaDataSubject({ ...dataSubjectPdElemementMapping.dataSubjectType, name: _dataSubject?.name });

    for (const pdElementMapping of dataSubjectPdElemementMapping.pdElementMappingList) {
      const _pdElement = await this.pdElementService.getPdElementById(pdElementMapping.pdElement?.id ?? 0);
      const categories = _pdElement?.categoryMappings ?? [];
      const classifications = _pdElement?.classificationMappings ?? [];
      pdElementMapping.pdElement = new PdElement({
        ...pdElementMapping.pdElement, name: _pdElement?.name,
        categoryIds: categories.map((c: any) => c.categoryId),
        categoryNames: categories.map((c: any) => c.categoryName),
        categoryMapping: _pdElement?.categoryMappings ?? [],
        classificationMapping: _pdElement?.classificationMappings ?? [],
        classificationId: classifications.map((c: any) => c.classificationId),
        classification: classifications.map((c: any) => c.classificationName),
      });
      pdElementMapping.originalPurposeMappingList = pdElementMapping?.purpose?.length ? [...pdElementMapping.purpose] : []
    }
    return dataSubjectPdElemementMapping;
  }

  async prepareDataSubjectMappingForm(dataSubjectPdElemementMapping: any, isEditMode: boolean = true) {
    const dataSubject = new DataSubjectPdElemementMapping({ ...dataSubjectPdElemementMapping });
    const _dataSubjectPdElemementMapping = await this._prepareDataSubjectMapping(dataSubject);
    const formGroup = buildDataSubjectMapping(this.fb, _dataSubjectPdElemementMapping, isEditMode);
    return formGroup;
  }


  async preparePdMappingList(pdElementMappingResponse: PdElementMappingResponse[]) {
    const pdElementMappingList: PdElementMapping[] = []
    for (const pdElementMappingRes of pdElementMappingResponse) {
      const _dataSubject = await this.dataSubjectService.getDataSubjectById(pdElementMappingRes?.dataSubjectId ?? 0);
      const _pdElement = await this.pdElementService.getPdElementById(pdElementMappingRes.pdElementId ?? 0);
      const dataSubject: any = new BpaDataSubject({ id: _dataSubject?.id, name: _dataSubject?.name })
      const pdElement = new PdElement({
        pdBpaMappingId: pdElementMappingRes.id,
        id: pdElementMappingRes.pdElementId,
        name: _pdElement?.name,

        categoryIds: _pdElement?.categoryId ? [_pdElement.categoryId] : [],
        categoryNames: _pdElement?.categoryName ? [_pdElement.categoryName] : [],
        categoryId: _pdElement?.categoryId ? [_pdElement.categoryId] : [],
        categoryName: _pdElement?.categoryName ? [_pdElement.categoryName] : [],
        classification: _pdElement?.classification ? [_pdElement.classification] : [],
        classificationId: _pdElement?.classificationId ? [_pdElement.classificationId] : [],
      });

      const pdElemementMapping = new PdElementMapping({ dataSubject: dataSubject, pdElement: pdElement as any })
      pdElementMappingList.push(pdElemementMapping)
    }
    return pdElementMappingList
  }

  async prepareDepartmentList(recepient: any) {
    if (recepient.entityType == Recipient.DEPARTMENT) {
      const department = await this.departmentService.getDepartmentById(recepient?.id ?? 0);
      recepient.name = (department?.name ?? '')
    }
    return recepient
  }

  async prepareLegalBasis(legalBasis: any) {
    const legalBasisData = await this.legalGroundService.getLegalGroundById(legalBasis?.id ?? 0);
    return {
      ...legalBasis,
      name: (legalBasisData?.name ?? ''),
      actId: (legalBasisData?.actId ?? 0),
      description: (legalBasisData?.description ?? '')
    }
  }

  async getRegulationFromLegalBasis(legalBasisId: number) {
    const legalBasisData = await this.legalGroundService.getLegalGroundById(legalBasisId ?? 0);
    if (legalBasisData?.actId) {
      const regulation = await this.prepareRegulation(legalBasisData.actId);
      return regulation
    }
    return null;
  }

  async prepareRegulation(regulationId: number) {
    const regulationsData = await this.regulationsService.getRegulationById(regulationId ?? 0);
    return regulationsData ? { ...regulationsData } : null
  }

  async prepareCountry(selectedCountry: any) {
    const countryData = await this.countryService.getCountryById(selectedCountry?.id ?? 0);
    return {
      ...selectedCountry,
      name: (countryData?.name ?? '')
    }
  }

  startDbSync() {
    this.dataSyncService.startSync(true)
  }

  clearAllList() {
    this.newPdElementsList = [];
    this.newSourceList = [];
    this.newAssetList = [];
    this.newRecepientList = [];
    this.newAssociatedDepartment = [];
    this.newPurposesList = [];
    this.bpaControllerList = [];
    this.newSecurityControlList = [];

    this.deletedPdElementMappingList = [];
    this.deletedSourceMappingList = [];
    this.deletedAssetMappingList = [];
    this.deletedRecepientMappingList = [];
    this.deletedAssociatedDepartment = [];
    this.deletedPurposesList = [];
    this.deletedBpaControllerList = [];
    this.deletedRegionList = [];
    this.deletedDataSubjectTypeList = [];
    this.deletedSourcePdMappingList = [];
    this.deletedAssetPdMappingList = [];
    this.deletedRecipientPdMappingList = []
  }

  preparePayloadForDeletedItems(bpaUpdatePayload: BpaUpdatePayload) {
    const deletedPurposesList = [...this.deletedPurposesList]
    const deletedRegionList = [...this.deletedRegionList]
    const deletedDataSubjectTypeList = [...this.deletedDataSubjectTypeList]

    const deletedPdElementMappingList = [...this.deletedPdElementMappingList]
    const deletedSourceMappingList = [...this.deletedSourceMappingList]
    const deletedAssetMappingList = [... this.deletedAssetMappingList]
    const deletedRecepientMappingList = [...this.deletedRecepientMappingList]

    bpaUpdatePayload.bpaPurposes = [...bpaUpdatePayload.bpaPurposes.concat((deletedPurposesList ?? []))];
    //  bpaUpdatePayload.dataSubjectRegionIds = [
    //   ...(bpaUpdatePayload.dataSubjectRegionIds || []),
    //   ...deletedRegionList
    // ];
    // bpaUpdatePayload.dataSubjectIds = [...bpaUpdatePayload.dataSubjectIds.concat((deletedDataSubjectTypeList ?? []))];

    bpaUpdatePayload.pdMappings = [...bpaUpdatePayload.pdMappings.concat((deletedPdElementMappingList ?? []))];
    bpaUpdatePayload.sourcePdElementsMappings = [...bpaUpdatePayload.sourcePdElementsMappings.concat((deletedSourceMappingList ?? []))];
    bpaUpdatePayload.assetPdElementsMappings = [...bpaUpdatePayload.assetPdElementsMappings.concat((deletedAssetMappingList ?? []))];
    bpaUpdatePayload.recipientPdElementsMappings = [...bpaUpdatePayload.recipientPdElementsMappings.concat((deletedRecepientMappingList ?? []))];
    return bpaUpdatePayload
  }

  async prepareProcessOwnerData(user: any) {
    if (!user) {
      return null
    }
    const userData = await this.userService.getUserById(user.userId);
    return { ...user, displayName: userData?.displayName ?? '' }
  }

  syncDepartment() {
    this.downloadConfigService.getDepartmentList();
  }
}
