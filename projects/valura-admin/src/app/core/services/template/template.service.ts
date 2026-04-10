import { inject, Injectable } from '@angular/core';
import { LSK_TEMPLATE_CURRENT_RQRID, LSK_TEMPLATE_FILTER, LSK_TEMPLATE_FILTER_LISTING, LSK_TEMPLATE_NEXT_REQ_SHIFTED, LSK_TEMPLATE_NEXT_RQRID, LSK_TEMPLATE_PREV_RQRID, LSK_TEMPLATE_PREV_SHIFTED } from '@admin-core/constants/local-storage-constants';
import { ApiHelperService } from '../network/api-helper.service';
import { Template, TemplateDetail } from '@admin-page/assessments/assessments/assignment-model';
import { AuthService } from '../auth.service';
import { UserService } from '../user/user.service';
import { AssessmentTypeService } from '../assessment-type/assessment-type.service';
import { Status } from '@admin-page/assessments/templates/constants';
import { stripHtml } from '@admin-page/assessments/templates/template-utils';
import { MANUAL_VENDOR_TEMPLATE_REQUEST, TEMPLATE_MANUAL_DRAFT_KEY } from '@admin-core/constants/constants';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE } from '@admin-core/constants/api-constants';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiHelperService = inject(ApiHelperService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private assessmentService = inject(AssessmentTypeService);
  private snackbarService = inject(SnackbarService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);

  constructor() { }


  getTemplateFilter() {
    const reqFilters = getItem(LSK_TEMPLATE_FILTER)
    return reqFilters
  }

  clearTemplateFilters() {
    removeItem(LSK_TEMPLATE_FILTER)
  }

  storeTemplateFilter(filters: any) {
    const reqFilters = getItem(LSK_TEMPLATE_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_TEMPLATE_FILTER, filterData);
  }

  getPrevTemplateShifted() {
    const val = localStorage.getItem(LSK_TEMPLATE_PREV_SHIFTED);
    return val == 'true' ? true : false
  }

  getPrevTemplateRid() {
    let result: any = localStorage.getItem(LSK_TEMPLATE_PREV_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  getTemplateRid() {
    let result: any = localStorage.getItem(LSK_TEMPLATE_CURRENT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  setTemplateRid(data: any) {
    setItem(LSK_TEMPLATE_CURRENT_RQRID, data);
  }

  setPrevTemplateRequestShifted(value: string) {
    localStorage.setItem(LSK_TEMPLATE_PREV_SHIFTED, value);
  }

  setPrevTemplateRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_TEMPLATE_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_TEMPLATE_FILTER, {
        ...filters,
        page: filters.prevPageNo,
        total: filters.prevPageNo == 1 ? filters.tempTotal : filters.total,
      });
      return
    }
    setItem(LSK_TEMPLATE_FILTER, {
      ...filters,
      prevPageNo: prevPageNo,
    });
  }

  getNextOrPrevTemplateRequestRid(index: number) {
    try {
      let requestList = this.getTemplateRid();
      let request = requestList[index];
      return request
    }
    catch (e) {
      return null
    }
  }

  getNextTemplateRequestShifted() {
    const val = localStorage.getItem(LSK_TEMPLATE_NEXT_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  getNextTemplateRequestRid() {
    let result: any = localStorage.getItem(LSK_TEMPLATE_NEXT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  setTemplateRequestRid(data: any) {
    setItem(LSK_TEMPLATE_CURRENT_RQRID, data);
  }

  setNextTemplateRequestShifted(value: string) {
    localStorage.setItem(LSK_TEMPLATE_NEXT_REQ_SHIFTED, value);
  }

  setNextTemplateRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_TEMPLATE_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_TEMPLATE_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_TEMPLATE_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  getNextTemplateRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_TEMPLATE_FILTER);
    let totalItems = 0;
    totalItems = Math.ceil(filters.total / filters.size);
    let pageNo = filters.page == 0 ? 1 : filters.page;
    const prevPageNo = pageNo;

    if (isDecrement) {
      pageNo--;
    } else {
      pageNo++;
    }

    if (pageNo > totalItems && !isDecrement) {
      return { exceeded: true, pageNo: 0 }
    }
    if (isDecrement && (prevPageNo == 1 || prevPageNo == 0)) {
      return { exceeded: true, pageNo: 0 }
    }
    return { exceeded: false, pageNo: pageNo }
  }

  removePrevTemplateRid() {
    removeItem(LSK_TEMPLATE_PREV_RQRID);
  }

  async getTemplateList(pageNo: number, isVendorContext: boolean, isDraft = false) {
    const filters = getItem(LSK_TEMPLATE_FILTER);
    const body = { ...filters, page: pageNo };

    const reqRidList: any[] = [];
    let res: any;

    if (isDraft) {
      res = await this.apiHelperService.getDraftManualRequests({
        key: isVendorContext ? MANUAL_VENDOR_TEMPLATE_REQUEST : TEMPLATE_MANUAL_DRAFT_KEY,
        page: pageNo,
        size: filters.size
      });

      (res?.content ?? []).forEach((item: any) => {
        reqRidList.push({
          requestRid: item.id
        });
      });

    } else {
      const _url = isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
      res = await this.assessmentApiHelperService.getTemplateList(body, _url);

      (res?.templates ?? []).forEach((item: any) => {
        reqRidList.push({
          requestRid: item.templateId ?? item.id
        });
      });
    }

    return reqRidList;
  }


  setPrevTemplateRequestRid(data: any) {
    setItem(LSK_TEMPLATE_PREV_RQRID, data);
  }

  removeNextTemplateRequestRid() {
    removeItem(LSK_TEMPLATE_NEXT_RQRID);
  }

  setNextTemplateRequestRid(data: any) {
    setItem(LSK_TEMPLATE_NEXT_RQRID, data);
  }

  storeRequestTemplateListingFilter(filters: any) {
    const reqFilters = getItem(LSK_TEMPLATE_FILTER_LISTING)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_TEMPLATE_FILTER_LISTING, filterData);
  }

  getTemplateRequestListingFilter() {
    const reqFilters = getItem(LSK_TEMPLATE_FILTER_LISTING)
    return reqFilters
  }

  clearTemplateRequestListingFilters() {
    removeItem(LSK_TEMPLATE_FILTER_LISTING)
  }

  async processTemplatedetails(templateDetails: TemplateDetail) {
    const userName = this.isInternalOrExternalUser ? templateDetails.template.createdBy : (await this.userService.getUserById(templateDetails.template.createdBy))?.displayName;
    const templateType = templateDetails.template.type ? await this.assessmentService.getAssessmentTypeById(templateDetails.template.type) : null;

    const result = {
      ...templateDetails,
      createdDate: this.formatDate(templateDetails.template.createdOn) || '',
      createdByUserName: userName,
      typeName: templateType?.name,
      status: this.getStatusText(templateDetails.template.status),
      totalSection: templateDetails.totalSection,
      totalQuestion: templateDetails.totalQuestion
    };
    return result;
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  formatDate(dateString?: string): string {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleDateString('en-GB');
  }

  getStatusText(status: string): string {
    if (!status) return '';

    const normalized = status.toUpperCase();

    if (normalized === Status.ACTIVE) return 'Active';
    if (normalized === Status.INACTIVE) return 'Inactive';

    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  }


  async prepareTemplateList(templateList: any[] = []) {
    const _templateList = await Promise.all(
      (templateList ?? []).map(async (item: any) => {
        const typeId = item.type;
        const matchedType = await this.assessmentService.getAssessmentTypeById(typeId)
        const user = item?.createdBy ? await this.userService.getUserById(item.createdBy) : undefined;
        return {
          ...item,
          createdByUserName: this.userService.getDisplayName(user),
          type: matchedType?.name ?? '',
          canDelete: item.canDelete ?? false
        };
      }));
    return _templateList
  }

  async prepareTemplateListForDraft(templateList: any[] = []) {
    const draftTemplateList = await Promise.all(
      (templateList ?? []).map(async (item: any) => {
        const formData = item?.formData ?? {};
        const template = formData?.template ?? {};
        const user = formData?.createdBy ? await this.userService.getUserById(formData.createdBy) : undefined;
        return {
          ...item,
          templateId: item?.id ?? '',
          name: template?.templateName ?? '',
          type: template?.templateType?.name ?? '',
          description: template?.description ?? '',
          createdOn: formData?.createdAt ?? '',
          createdBy: formData.createdBy,
          createdByUserName: this.userService.getDisplayName(user),
          status: template?.status ?? '',
          isCloned: template?.isCloned ?? false,
          canDelete: item?.canDelete ?? false
        };
      }));
    return draftTemplateList
  }

  validateAllQuestions(sectionsList: any[]): boolean {
    if (!sectionsList || sectionsList.length === 0) {
      this.snackbarService.openSnack('Please add at least one section.');
      return false;
    }

    for (let sIndex = 0; sIndex < sectionsList.length; sIndex++) {
      const section = sectionsList[sIndex]
      const questions = section.questions;
      if (!questions || questions.length === 0) {
        const sectionTitle = section.sectionTitle || section.section || ''
        this.snackbarService.openSnack(`Section "${sectionTitle}" must contain at least one question.`);
        return false;
      }

      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];
        const cleanText = stripHtml(question.text);
        const cleanHelper = stripHtml(question.helper);
        if (!cleanText) {
          this.snackbarService.openSnack(`Question text cannot be empty.`);
          return false;
        }

        if (!question.type || !question.type.trim()) {
          this.snackbarService.openSnack(`Question type is required.`);
          return false;
        }
        if (question.type === 'SINGLE_SELECT' || question.type === 'MULTI_SELECT' || question.type === 'RADIO') {
          if (!question.options || question.options.length === 0) {
            this.snackbarService.openSnack(`Please add at least one option.`);
            return false;
          }
          const hasEmptyOption = question.options.some((opt: any) => !opt.value || !opt.value.trim());

          if (hasEmptyOption) {
            this.snackbarService.openSnack(`Option values cannot be empty.`);
            return false;
          }
        }
      }
    }
    return true;
  }
}
