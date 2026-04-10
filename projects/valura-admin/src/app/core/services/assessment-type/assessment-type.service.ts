import { inject, Injectable } from '@angular/core';
import { AssessmentType } from '@admin-core/models/assessment/assessment';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';

@Injectable({
  providedIn: 'root'
})
export class AssessmentTypeService {

  assessmentTypeMasterList: AssessmentType[] = []

  constructor() { }


  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getAssessmentTypeMasterList(forceLoad: boolean = false) {
    let assessmentTypeList = await this.dbService.getAllAssessmentType();

    if (forceLoad || !assessmentTypeList?.length) {
      const res = await this.downloadConfigService.getAssessmentTypesList();
      let _assessmentTypeList = await this.dbService.getAllAssessmentType();
      assessmentTypeList = [..._assessmentTypeList]
    }
    this.assessmentTypeMasterList = [...assessmentTypeList]
    return assessmentTypeList ?? [];
  }

  async addAssessmentType(assessmentType: AssessmentType) {
    await this.dbService.addAssessmentType(assessmentType);
  }

  createAssessmentTypeObj(assessmentType: AssessmentType) {
    const newAssessmentType: AssessmentType = {
      ...assessmentType
    };
    return newAssessmentType
  }

  async createAndNewAssessmentType(assessmentType: AssessmentType) {
    const newAssessmentType = this.createAssessmentTypeObj(assessmentType)
    await this.addAssessmentType(newAssessmentType);
    return newAssessmentType
  }


  async updateAssessmentTypeToDb(assessmentType: AssessmentType) {

  }

  async deleteAssessmentType(assessmentTypeId: number) {

  }

  async getAssessmentTypeById(assessmentTypeId: number) {
    const assessmentType = await this.dbService.getAssessmentTypeById(assessmentTypeId);
    return assessmentType
  }
}

