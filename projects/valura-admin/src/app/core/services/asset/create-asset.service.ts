import { inject, Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DataSyncService } from '../download/data-sync.service';
import { Department } from '@admin-core/models/department-management/department.model';
import { DownloadConfigService } from '../download/download-config.service';

@Injectable({
  providedIn: 'root'
})
export class CreateAssetService {
  private dataSyncService = inject(DataSyncService);
  newDepartmentList: Department[] = [];
  newVendorList: any[] = [];
  newSecurityControlList: any[] = [];

  private downloadConfigService = inject(DownloadConfigService);

  constructor(private fb: FormBuilder,) { }

  onCreateOrUpdateDepartment(result: any) {

    const deptIndex = this.newDepartmentList.findIndex(dept => dept.id == result?.id);
    if (deptIndex > -1) {
      this.newDepartmentList[deptIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newDepartmentList.push(result);
    }
  }

  startDbSync() {
    this.dataSyncService.startSync(true)
  }

  onCreateOrUpdateVendor(result: any) {

    const deptIndex = this.newVendorList.findIndex(dept => dept.id == result?.id);
    if (deptIndex > -1) {
      this.newVendorList[deptIndex] = { ...result }
    }
    else {
      const idExist = typeof result?.id === "number" ? true : false
      if (idExist) {
        result = { ...result, isUpdated: true }
      }
      this.newVendorList.push(result);
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

  syncDepartment() {
    this.downloadConfigService.getDepartmentList();
  }
}
