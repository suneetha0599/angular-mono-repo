import { inject, Injectable } from '@angular/core';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { DbService } from '../db/db.service';
import { ApiHelperService } from '../network/api-helper.service';
import { ADMIN_USER, EXTERNAL_USER, FIRST_PAGE, INTERNAL_USER, PAGINATION_SIZE } from '@admin-core/constants/constants';
import { LSK_DSR_CONFIGURATION_LIST } from '@admin-core/constants/local-storage-constants';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth.service';
import { User } from '@admin-core/models/user.model';
import { setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class DownloadConfigService {

  public requestSubject$: BehaviorSubject<any> = new BehaviorSubject(null);
  public retryLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  totalAdminRequestCount: number = 21;
  totalExternalUserRequestCount: number = 7;

  totalRequestCount: number = 0;
  totalCompletedRequestCount: number = 0;
  totalFailedRequestCount: number = 0;
  totalSuccesRequestCount: number = 0;
  failedRequests: Array<() => Promise<any>> = [];

  private configApiHelperService = inject(ConfigApiHelperService);
  private apiHelperService = inject(ApiHelperService);
  private authService = inject(AuthService);
  private dbService = inject(DbService);

  constructor() { }

  setTotalRequestCount() {
    this.totalRequestCount = this.isInternalOrExternalUser ? this.totalExternalUserRequestCount : this.totalAdminRequestCount
  }

  onRequestStart(): void {
    // this.totalRequestCount++;
  }

  onRequestSuccess(): void {
    this.totalSuccesRequestCount++;
  }

  onRequestFailed(): void {
    this.totalFailedRequestCount++;
  }

  onRequestComplete(): void {
    this.totalCompletedRequestCount = this.totalCompletedRequestCount + 1;
    const downloadIsCompleted = this.totalRequestCount === this.totalCompletedRequestCount
    this.requestSubject$.next({
      totalCount: this.totalRequestCount,
      completedCount: this.totalCompletedRequestCount,
      downloadIsCompleted: downloadIsCompleted,
      totalSuccesRequestCount: this.totalSuccesRequestCount,
      totalFailedRequestCount: this.totalFailedRequestCount
    });
    if (downloadIsCompleted) {
      if (this.totalFailedRequestCount > 0) {
        // this.retryFailed();
      }
      else {
        setTimeout(() => {
          this.authService.postConfigurationDownload();
        }, 0);
      }
    }
  }

  async retryFailed() {
    this.retryLoading$.next(true);
    const toRetry = [...this.failedRequests];
    console.warn(toRetry.length)
    this.failedRequests = [];
    this.totalCompletedRequestCount = this.totalSuccesRequestCount
    this.totalFailedRequestCount = 0;
    await Promise.all(toRetry.map(fn => fn()));
    this.retryLoading$.next(false)

  }

  get showProgressBar(): boolean {
    return (this.totalRequestCount > this.totalCompletedRequestCount)
  }

  async startDownload() {
    this.setTotalRequestCount();
    if (this.isAdminUser) {
      this.getDsrConfiguration();
    }
    if (this.isAdminUser || this.isInternalOrExternalUser) {
      await Promise.all([
        this.getUserMasterList(ADMIN_USER, u => this.dbService.addBulkAdminUsers(u)),
        this.getUserMasterList(INTERNAL_USER, u => this.dbService.addBulkInternalUsers(u)),
        this.getUserMasterList(EXTERNAL_USER, u => this.dbService.addBulkExternalUsers(u))
      ]);
    }
    if (this.isAdminUser) {
      this.getDepartmentList();
      this.getCountryMasterList()
    }
    if (this.isAdminUser || this.isInternalOrExternalUser) {
      this.getRegulationList();
      this.getRightsList();
      this.getLegalBasis();
      this.getTriggersList();
    }
    if (this.isAdminUser) {
      this.getValidationQuestionsList();
      this.getDeclarationList();
      this.getSecurityControlMasterList();
      this.getThirdPartyList();
      this.getPlatformList();
      this.getPdElementList();
      this.getPdCategoryList();
      this.getDataSubjectsList();
      this.getParametersList();
      this.getAssessmentTypesList();
      this.getClassificationList()
    }
  }

  async getDsrConfiguration() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getDsrConfiguration();
      if (res) {
        setItem(LSK_DSR_CONFIGURATION_LIST, (res))
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getDsrConfiguration());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getAdminUserMasterList() {
    const params = {
      userType: ADMIN_USER,
      size: 50,
    };
    this.onRequestStart();
    try {
      const res = await this.apiHelperService.getUserMasterList(params);
      if (res) {
        const users = (res?.users ?? []);
        // const adminUsers = users.map((user: User) => ({  //temporary logic, in future it should move to backend
        //   ...user,
        //   userType: ADMIN_USER
        // }));
        await this.dbService.addBulkAdminUsers(users);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getAdminUserMasterList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getInternalUserMasterList() {
    const params = {
      userType: INTERNAL_USER,
      size: 50,
    };
    this.onRequestStart();
    try {
      const res = await this.apiHelperService.getUserMasterList(params);
      if (res) {
        const users = (res?.users ?? []);
        // const internalUsers = users.map((user: User) => ({  //temporary logic, in future it should move to backend
        //   ...user,
        //   userType: INTERNAL_USER
        // }));
        await this.dbService.addBulkInternalUsers(users);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getInternalUserMasterList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getExternalUserMasterList() {
    const params = {
      userType: EXTERNAL_USER,
      size: 50,
    };
    this.onRequestStart();
    try {
      const res = await this.apiHelperService.getUserMasterList(params);
      if (res) {
        const users = (res?.users ?? []);
        // const externalUsers = users.map((user: User) => ({ //temporary logic, in future it should move to backend
        //   ...user,
        //   userType: EXTERNAL_USER
        // }));
        await this.dbService.addBulkExternalUsers(users);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getExternalUserMasterList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getDepartmentList() {
    this.onRequestStart();
    try {
      const res = await this.apiHelperService.getDepartmentsList();
      if (res) {
        const departments = (res?.departments ?? []);
        await this.dbService.addBulkDepartments(departments);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getDepartmentList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getCountryMasterList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getCountriesList();
      if (res) {
        const country = (res ?? []);
        await this.dbService.addBulkCountry(country);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getCountryMasterList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getRegulationList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getRegulationList();
      if (res) {
        const regulations = (res?.acts ?? []);
        await this.dbService.addBulkRegulations(regulations);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getRegulationList());
    }
    finally {
      this.onRequestComplete();
    }
  }


  async getRightsList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getRightsMasterList();
      if (res) {
        const rights = (res?.rights ?? []);
        await this.dbService.addBulkRights(rights);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getRightsList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getLegalBasis() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getLegalBasisMasterList();
      if (res) {
        const legalbasis = (res?.legalBasis ?? []);
        await this.dbService.addBulkLegalBasis(legalbasis);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getLegalBasis());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getTriggersList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getActsTriggerList();
      if (res) {
        const triggers = (res?.triggers ?? []);
        await this.dbService.addBulkTriggers(triggers);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getTriggersList());
    }
    finally {
      this.onRequestComplete();
    }
  }


  async getValidationQuestionsList() {
    const params = {

    }
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getValidationQuestionsList();
      if (res) {
        const validationQuestions = (res?.generalValidationQuestions ?? []);
        await this.dbService.addBulkValidationQuestion(validationQuestions);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getValidationQuestionsList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getDeclarationList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getDeclarationList();
      if (res) {
        const generalDeclarations = (res?.generalDeclaration ?? []);
        await this.dbService.addBulkDeclaration(generalDeclarations);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getDeclarationList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getSecurityControlMasterList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getSecurityControls();
      if (res) {
        const securityControls = (res?.securityControls ?? []);
        await this.dbService.addBulkSecurityControls(securityControls);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getSecurityControlMasterList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getThirdPartyList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getThirdPartyList();
      if (res) {
        const thirdPartyRoles = (res?.thirdPartyRoles ?? []);
        await this.dbService.addBulkThirdParty(thirdPartyRoles);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getThirdPartyList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getPlatformList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getPlatformList();
      if (res) {
        const thirdPartyRoles = (res?.platform ?? []);
        await this.dbService.addBulkPlatform(thirdPartyRoles);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getPlatformList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getPdElementList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getPDElements();
      if (res) {
        const pdElements = (res?.pdElements ?? []);
        await this.dbService.addBulkPdElements(pdElements);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getPdElementList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getPdCategoryList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getPdCategories();
      if (res) {
        const pdCategories = (res?.pdCategories ?? []);
        await this.dbService.addBulkPdCategory(pdCategories);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getPdCategoryList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getDataSubjectsList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getDataSubjectList();
      if (res) {
        const dataSubjects = (res?.dataSubjects ?? []);
        await this.dbService.addBulkDataSubject(dataSubjects);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getDataSubjectsList());
    }
    finally {
      this.onRequestComplete();
    }
  }


  async getParametersList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getParameters();
      if (res) {
        const parameters: any = (res?.data?.parameters ?? []);
        await this.dbService.addBulkParameters(parameters);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getParametersList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getAssessmentTypesList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getAssessmentTypes();
      if (res) {
        const assessmentTypes: any = (res?.assessmentTypes ?? []);
        await this.dbService.addBulkAssessmentTypes(assessmentTypes);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getAssessmentTypesList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  async getClassificationList() {
    this.onRequestStart();
    try {
      const res = await this.configApiHelperService.getClassifications();
      if (res) {
        const classification = (res?.classification ?? []);
        await this.dbService.addBulkClassification(classification);
        this.onRequestSuccess();
      }
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getClassificationList());
    }
    finally {
      this.onRequestComplete();
    }
  }

  resetDownloadCountData() {
    this.setTotalRequestCount();
    this.totalCompletedRequestCount = 0;
    this.totalFailedRequestCount = 0;
    this.totalSuccesRequestCount = 0;
    this.failedRequests = []
  }

  private async getUserMasterList(userType: string, saveToUserDbFn: (users: User[]) => Promise<unknown>): Promise<void> {
    const pageSize = PAGINATION_SIZE.PAGE_SIZE_20;
    let pageNo = FIRST_PAGE;

    try {
      while (true) {
        const res = await this.apiHelperService.getUserMasterList({ userType, size: pageSize, page: pageNo });
        const users: User[] = res?.users ?? [];
        const totalItems = res?.totalItems ?? 0
        if (!users.length) break;
        await saveToUserDbFn(users);
        if (pageNo * pageSize >= totalItems) break;
        pageNo++;
      }
      this.onRequestSuccess();
    }
    catch (e) {
      console.error(e);
      this.onRequestFailed();
      this.failedRequests.push(() => this.getUserMasterList(userType, saveToUserDbFn));
    }
    finally {
      this.onRequestComplete();
    }
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  get isAdminUser(): boolean {
    return !!(this.authService.isAdminUser)
  }

}
