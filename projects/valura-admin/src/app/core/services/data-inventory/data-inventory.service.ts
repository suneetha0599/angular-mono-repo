import { Injectable, NgZone } from '@angular/core';
import { DICategory, DIDataSubject, PdElement, Purpose } from '@admin-core/models/DataDiscovery/DataInventory';
import { DataSubjectService } from '../dataSubject/data-subject.service';
import { PdElementService } from '../pdElement/pd-element.service';
import { LegalGroundService } from '../legal-ground/legal-ground.service';

@Injectable({
  providedIn: 'root'
})
export class DataInventoryService {

  constructor(private ngZone: NgZone, private dataSubjectService: DataSubjectService, private pdElementService: PdElementService,
    private legalGroundService: LegalGroundService,
  ) { }

  async prepareDataSubjectMappingList(dataSubjectList: any[]): Promise<any[]> {
    if (!dataSubjectList?.length) return [];

    return await this.ngZone.runOutsideAngular(async () => {
      let tempDataSubjectList: DIDataSubject[] = [];

      for (const ds of dataSubjectList) {
        const _dataSubjectFromDb = await this.dataSubjectService.getDataSubjectById(ds?.dsId ?? 0);
        const _dataSubject = new DIDataSubject({ ..._dataSubjectFromDb, categoryList: [] });
        const pdElementFromDb = await this.pdElementService.getPdElementById(ds?.pdId ?? 0);

        let findTempDs = tempDataSubjectList.find(_ds => _ds.id == ds?.dsId);
        if (findTempDs) {
          for (const _pdCategory of (pdElementFromDb?.categoryMappings ?? [])) {
            let findCategory = findTempDs.categoryList.find(_category => _category.id == _pdCategory.categoryId);
            if (findCategory) {
              let findPdElements = findCategory.pdElementList.find(_pdElement => _pdElement.id == pdElementFromDb?.id);
              if (findPdElements) {
                findPdElements = new PdElement({ ...pdElementFromDb, purposes: ds.purposes, expanded: false });
                findPdElements.purposeCount = ds.purposes.length
              }
              else {
                const _pdElement = new PdElement({ ...pdElementFromDb, purposes: ds.purposes, expanded: false });
                _pdElement.purposeCount = ds.purposes.length
                findCategory.pdElementList.push({ ..._pdElement });
              }
            }
            else {
              if (!_pdCategory.categoryId) {
                continue
              }
              let category = new DICategory({
                id: _pdCategory.categoryId ?? 0,
                name: _pdCategory?.categoryName ?? '',
                pdElementList: []
              })
              const _pdElement = new PdElement({ ...pdElementFromDb, purposes: ds.purposes, expanded: false });
              _pdElement.purposeCount = ds.purposes.length
              category.pdElementList.push({ ..._pdElement });
              findTempDs.categoryList.push({ ...category })
            }
          }
        }
        else {

          let _tempDataSubject: DIDataSubject = {
            id: ds?.dsId ?? 0,
            name: _dataSubject?.name || '',
            categoryList: []
          };

          if (pdElementFromDb) {
            for (const _pdCategory of (pdElementFromDb?.categoryMappings ?? [])) {
              if (!_pdCategory.categoryId) {
                continue
              }
              let category = new DICategory({
                id: _pdCategory.categoryId ?? 0,
                name: _pdCategory?.categoryName ?? '',
                pdElementList: []
              })
              const _pdElement = new PdElement({ ...pdElementFromDb, purposes: ds.purposes, expanded: false });
              _pdElement.purposeCount = ds.purposes.length
              category.pdElementList.push({ ..._pdElement });
              _tempDataSubject.categoryList = [{ ...category }]
            }
          }
          tempDataSubjectList.push(_tempDataSubject);
        }
      }

      return tempDataSubjectList;
    });
  }

  async preparePurposeList(purposeList: Purpose[]): Promise<any[]> {
    if (!purposeList?.length) return [];

    return await this.ngZone.runOutsideAngular(async () => {
      for (const purpose of purposeList) {
        for (const legalbasis of purpose.legalBases) {
          const _legalGroundFromDb = await this.legalGroundService.getLegalGroundById(legalbasis?.id ?? 0);
          legalbasis.name = (_legalGroundFromDb?.description ?? '')
        }
      }
      return purposeList;
    });
  }
}
