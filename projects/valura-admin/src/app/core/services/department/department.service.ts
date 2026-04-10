import { inject, Injectable } from '@angular/core';
import { Department } from '@admin-core/models/user-management/users.model';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  departmentMasterList: Department[] = []
  newDepartmentList: Department[] = [];

  constructor() { }

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getDepartmentMasterList(forceLoad: boolean = false): Promise<Department[]> {
    let departmentList = await this.dbService.getAllDepartments();

    if (forceLoad || !departmentList?.length) {
      await this.downloadConfigService.getDepartmentList();
      let _departmentList = await this.dbService.getAllDepartments();
      departmentList = [..._departmentList];
    }

    this.departmentMasterList = [...departmentList];
    return departmentList ?? [];
  }

  async getDepartments(
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ): Promise<Department[]> {
    const { sortBy, sortDirection, searchText } = filters;

    let departmentList = await this.dbService.getAllDepartments() || [];

    if (searchText && searchText.trim()) {
      const text = searchText.trim().toLowerCase();
      departmentList = departmentList.filter((dept: Department) =>
        (dept.name ?? "").toLowerCase().includes(text) ||
        (dept.description ?? "").toLowerCase().includes(text)
      );
    }

    if (sortBy) {
      departmentList = departmentList.sort((a: any, b: any) => {
        const aValue = (a[sortBy] ?? "").toString().toLowerCase();
        const bValue = (b[sortBy] ?? "").toString().toLowerCase();

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    this.departmentMasterList = departmentList;
    return departmentList;
  }


  async addDepartment(department: Department): Promise<void> {
    await this.dbService.addDepartment(department);
  }


  async addBulkDepartments(departments: Department[]): Promise<number> {
    return this.dbService.addBulkDepartments(departments);
  }


  createDepartmentObj(department: Department): Department {
    const newDepartment: Department = {
      ...department
    };
    return newDepartment;
  }


  async createAndNewDepartment(department: Department): Promise<Department> {
    const newDepartment = this.createDepartmentObj(department);
    await this.addDepartment(newDepartment);
    return newDepartment;
  }


  async updateDepartmentDetailsDb(departmentId: number, departmentDetail: any): Promise<Department | undefined> {
    const existingDept = await this.dbService.getDepartmentsById(departmentId);
    const updatedDept = { ...existingDept, ...departmentDetail };
    const updated = await this.dbService.updateDepartments(departmentId, updatedDept);
    return updated;
  }


  async deleteDepartment(departmentId: number): Promise<void> {
    await this.dbService.deleteDepartment(departmentId);
  }


  async getDepartmentById(departmentId: number): Promise<Department | undefined> {
    const department = await this.dbService.getDepartmentsById(departmentId);
    return department;
  }


  async refreshDepartmentInList(departmentId: number): Promise<void> {
    const department = await this.getDepartmentById(departmentId);
    if (department) {
      const index = this.departmentMasterList.findIndex(d => d.id === departmentId);
      if (index !== -1) {
        this.departmentMasterList[index] = department;
      } else {
        this.departmentMasterList.push(department);
      }
    }
  }


  removeDepartmentFromList(departmentId: number): void {
    this.departmentMasterList = this.departmentMasterList.filter(d => d.id !== departmentId);
  }

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

  clearNewDepartmentList() {
    this.newDepartmentList = [];
  }

  getNewDepartmentMasterList(departmentIds: any[]) {
    // return this.newDepartmentList;
    const filteredDepartments = this.newDepartmentList.filter(d => (departmentIds ?? []).includes(d.id));
    return filteredDepartments
  }

  syncDepartment() {
    this.downloadConfigService.getDepartmentList();
  }
}

