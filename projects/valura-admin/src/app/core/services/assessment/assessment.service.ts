import { inject, Injectable } from '@angular/core';
import { LSK_ASSESSMENT_BPA_DETAIL, LSK_ASSESSMENT_CURRENT_RQRID, LSK_ASSESSMENT_REQ_FILTER, LSK_ASSESSMENT_FILTER_LISTING, LSK_VENDOR_ASSESSMENT_FILTER_LISTING, LSK_ASSESSMENT_NEXT_REQ_SHIFTED, LSK_ASSESSMENT_NEXT_RQRID, LSK_ASSESSMENT_PREV_RQRID, LSK_ASSESSMENT_PREV_SHIFTED, LSK_ASSESSMENT_ROUTE, ROUTE_BACK, LSK_ASSESSMENT_FORM_CHANGED } from '@admin-core/constants/local-storage-constants';
import { AuthService } from '../auth.service';
import { ApiHelperService } from '../network/api-helper.service';
import { BehaviorSubject } from 'rxjs';
import { UserService } from '../user/user.service';
import { TriggerService } from '../trigger/trigger.service';
import { AssessmentData } from '@admin-page/assessments/assessments/assignment-model';
import { AssessmentTypeService } from '../assessment-type/assessment-type.service';
import { AssessmentBpaDetails } from '@admin-core/models/assessment/assessment';
import { CreateBpaService } from '../bpa/create-bpa.service';
import { RegulationsService } from '../regulations/regulations.service';
import { AccessRecord, AccessRecordLabel, AssessmentStatus } from '@admin-page/assessments/assessments/constants';
import { EXTERNAL_USER, INTERNAL_USER } from '@admin-core/constants/constants';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {

  deletedSectionsList: any = []
  deletedQuestionsList: any = []
  _routeDetails = {
    isRouted: false,
  }
  _bpaDetails: any
  LOGIN_URL = 'login';
  SSO_AUTH = 'sso-auth';
  EXTERNAL_AUTH = 'external-auth';
  assessmentTemplateDetail: any = null;
  currentRespondentList: any = []
  currentRespondentUser: any = null;
  deletedApproverList: any = [];
  currentApproverList: any = [];
  currentAuthor: any = null;

  ADMIN_TOKEN = 'token'

  public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public formIsUpdated$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private authService = inject(AuthService);
  private apiHelperService = inject(ApiHelperService);
  private userService = inject(UserService);
  private triggerService = inject(TriggerService);
  private assessmentTypeService = inject(AssessmentTypeService);
  private createBpaService = inject(CreateBpaService);
  private regulationService = inject(RegulationsService)
  private snackbarService = inject(SnackbarService);

  constructor() {
    const formIsUpdated = this.getFormState();
    this.updateFormState(formIsUpdated)
  }

  setFormState(formState: boolean) {
    setItem(LSK_ASSESSMENT_FORM_CHANGED, formState);
  }

  getFormState() {
    return !!getItem(LSK_ASSESSMENT_FORM_CHANGED);
  }

  removeFormState() {
    removeItem(LSK_ASSESSMENT_FORM_CHANGED);
  }

  updateFormState(formUpdated: boolean) {
    this.formIsUpdated$.next(formUpdated);
    if (formUpdated) {
      this.setFormState(formUpdated);
      return
    }
    this.removeFormState();
  }

  clearRouteDetails() {
    removeItem(LSK_ASSESSMENT_ROUTE)
    this._routeDetails = {
      isRouted: false,
    }
  }

  setRouteDetails(isRouted: boolean) {
    this._routeDetails = {
      isRouted: isRouted,
    }
    setItem(LSK_ASSESSMENT_ROUTE, this._routeDetails)
  }

  get routeDetails() {
    const details = getItem(LSK_ASSESSMENT_ROUTE);
    this._routeDetails.isRouted = details?.isRouted
    return this._routeDetails.isRouted
  }

  setBpaDetails(bpaDetails: any) {
    this._bpaDetails = {
      ...bpaDetails
    }
    setItem(LSK_ASSESSMENT_BPA_DETAIL, this._bpaDetails)
  }

  getBPADetails() {
    const details = getItem(LSK_ASSESSMENT_BPA_DETAIL);
    this._bpaDetails = details
    return this._bpaDetails
  }

  clearBPADetails() {
    removeItem(LSK_ASSESSMENT_BPA_DETAIL)
    this._bpaDetails = null
  }

  get routeBack() {
    return getItem(ROUTE_BACK)
  }

  deleteRouteBack() {
    removeItem(ROUTE_BACK)
  }

  setRouteBack(route: string) {
    setItem(ROUTE_BACK, route)
  }

  async navigateToQuestionnare(assessmentLink: string, openLink: boolean = true) {
    if (!assessmentLink) {
      return
    }
    this.isLoading$.next(true);
    let token = this.authService.getAuthToken();

    if (this.authService.isRefreshTokenExpiringSoon || this.authService.isRefreshTokenExpired) {
      const body = {
        refreshToken: this.authService.getRefreshToken()
      }
      const data = await this.apiHelperService.getRefreshToken(body);
      token = data?.token;
    }
    if (token) {
      try {
        const routeUrl = openLink ? this.SSO_AUTH : this.EXTERNAL_AUTH;
        assessmentLink = assessmentLink.replace(`/${this.LOGIN_URL}`, `/${routeUrl}`);
        const newAssessmentLink = `${assessmentLink}&${this.ADMIN_TOKEN}=${token}`;
        if (openLink) {
          window.open(newAssessmentLink);
        }
        else {
          return newAssessmentLink;
        }
      }
      catch (e) {
        this.snackbarService.openSnack("Invalid link!")
      }
      finally {
        this.isLoading$.next(false)
      }
      return
    }
    this.isLoading$.next(false);
    return
  }

  async prepareAssessmentDetail(assessmentData: AssessmentData) {
    if (assessmentData?.author?.userId) {
      const owner = await this.userService.getUserById(assessmentData.author.userId)
      assessmentData.author = { ...assessmentData.author, displayName: owner?.displayName ?? '', email: owner?.email ?? '' }
      this.currentAuthor = assessmentData.author
    }
    const approvers: any = assessmentData.approverDetails ?? [];
    const tempApprovers: any[] = [];
    for (let approver of approvers) {
      const userId = approver?.approver?.userId;
      if (!userId) continue;
      const _approver = await this.userService.getUserById(userId);
      tempApprovers.push({
        ...approver,
        approver: { ...approver.approver, displayName: _approver?.displayName ?? '', email: _approver?.email ?? '', approverMappingId: approver.approverMappingId }
      });
    }
    assessmentData.approverDetails = tempApprovers;
    const respondents: any = assessmentData?.respondentDetails ?? [];
    let tempRespondents: any[] = [];
    const currentUserId = (this.authService.getUserInfo()?.applicationUserId ?? 0);
    this.currentApproverList = [...tempApprovers]
    if (respondents?.length) {
      for (let respondent of respondents) {
        const userId = respondent?.respondent?.userId;

        if (!userId) continue;

        const _respondent = await this.userService.getUserById(userId);

        tempRespondents.push({
          ...respondent,
          respondent: {
            ...respondent.respondent,
            displayName: _respondent?.displayName ?? '',
            email: _respondent?.email ?? '',
            respondentMappingId: respondent.respondentMappingId
          }
        });
      }
      assessmentData.respondentDetails = [...tempRespondents];
      this.currentRespondentList = [...tempRespondents];
    }
    const triggerList: any[] = [];

    if (assessmentData?.triggerMappings?.length) {
      for (const trig of assessmentData.triggerMappings) {
        if (!trig) continue;
        const triggerDetail = await this.triggerService.getTriggerById(trig.triggerId);

        if (triggerDetail) {
          triggerList.push({
            ...trig,
            ...triggerDetail
          });
        }
      }
      assessmentData.triggerMappings = [...triggerList]
    }
    const regulationList: any[] = [];
    const uniqueActIds = new Set<number>();
    if (assessmentData?.triggerMappings?.length) {
      for (const trig of assessmentData.triggerMappings) {
        if (!trig) continue;
        const triggerDetail = await this.triggerService.getTriggerById(trig.triggerId);
        if (!triggerDetail?.actId) continue;
        const actId = triggerDetail.actId;
        if (uniqueActIds.has(actId)) continue;
        const regulationDetail = await this.regulationService.getRegulationById(actId);
        if (regulationDetail) {
          regulationList.push(regulationDetail);
          uniqueActIds.add(actId);
        }
      }
      assessmentData.regulationList = regulationList;
    }
    const assessmentTypeId = assessmentData?.assessmentTypeId;
    if (assessmentTypeId) {
      const assessmentType = await this.assessmentTypeService.getAssessmentTypeById(assessmentTypeId)
      assessmentData.assessmentType = { id: assessmentType?.id ?? 0, name: assessmentType?.name ?? '' }
    }

    const _assessmentDetail = {
      name: assessmentData?.title ?? '',
      type: assessmentData?.assessmentType ?? 0,
      typeName: assessmentData?.assessmentType?.name ?? '',

      bpaName: assessmentData?.bpaName ?? '',
      status: assessmentData?.status ?? '',

      dueDate: this.convertToDateFormat(assessmentData?.dueDate),
      createdOn: this.convertToDateFormat(assessmentData?.createdAt),

      owner: assessmentData?.author ?? null,

      trigger: triggerList ?? [],
      regulationList: assessmentData?.regulationList ?? [],

      approvers: assessmentData?.approverDetails ?? [],
      respondents: assessmentData?.respondentDetails ?? [],

      riskMatrix: assessmentData?.riskMatrix ?? '',
      description: assessmentData?.description ?? '',

      assessmentLink: assessmentData?.assessmentLink ?? '',
      daysLeft: assessmentData?.assessmentAge ?? 0,

      templateId: assessmentData?.templateId ?? '',
      clarification: assessmentData?.classification ?? '',
      processingFor: assessmentData?.processedFor?.bpa?.bpaId ? AccessRecord.PROCESSING_ACTIVITY : AccessRecord.ASSET,
      respondentType: assessmentData?.respondentDetails[assessmentData?.respondentDetails.length - 1]?.respondent?.userType === INTERNAL_USER ? INTERNAL_USER : EXTERNAL_USER
    };
    return { _assessmentData: assessmentData, _assessmentDetail: _assessmentDetail }
  }

  convertToDateFormat(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (e) {
      return '';
    }
  }

  prepareAssessmentListForDraft(assessmentMasterList: any, pageNo: number, pageSize: number) {
    const _assessmentMasterList = (assessmentMasterList ?? []).map(
      (item: any, index: number) => ({
        id: ((pageNo - 1) * pageSize) + index + 1,
        draftId: item?.id ?? 0,
        name: item.formData?.overview?.title ?? '',
        bpaName: item.formData?.overview?.bpa?.name ?? '',
        status: item.formData?.status ?? '',
        createdOn: item.formData?.createdAt ?? '',
        trigger: item.formData?.trigger?.triggerList?.map((t: any) => t.name) ?? [],
        owner: item.formData?.overview?.author?.displayName ?? '',
        dueDate: item.formData?.overview?.completeBy ?? '',
        actions: '',
        processingFor: this.getDraftProcessedForLabel(item.formData?.overview),
      }));
    return _assessmentMasterList ?? []
  }

  private getDraftProcessedForLabel(overview: any): string {
    const processingFor = overview?.processingFor;
    const bpa = overview?.bpa;
    if (processingFor === AccessRecord.ASSET && bpa?.assetId) {
      return AccessRecordLabel.ASSET;
    } else if (processingFor === AccessRecord.PROCESSING_ACTIVITY && bpa?.bpaId) {
      return AccessRecordLabel.PROCESSING_ACTIVITY;
    } else if (processingFor === AccessRecord.VENDOR && (bpa?.vendorId || bpa?.id)) {
      return AccessRecordLabel.VENDOR;
    }
    return '';
  }

  async prepareAssessmentList(assessmentMasterList: any) {
    for (const assessment of assessmentMasterList) {
      const userId = assessment?.owner?.userId ?? 0;
      let user: any = null
      if (userId) {
        user = await this.userService.getUserById(userId);
      }
      assessment.owner = user?.displayName ?? ''
      if (assessment?.processedFor) {
        if (assessment?.processedFor?.assets?.length) {
          assessment.processedFor = AccessRecordLabel.ASSET
        } else if (assessment?.processedFor?.vendors?.length) {
          assessment.processedFor = AccessRecordLabel.VENDOR
        } else if (assessment?.processedFor?.bpa?.bpaId) {
          assessment.processedFor = AccessRecordLabel.PROCESSING_ACTIVITY
        } else {
          assessment.processedFor = '-'
        }
      }
      assessment.trigger = assessment.trigger ? [assessment.trigger] : [];
    }
    return assessmentMasterList ?? []
  }

  async prepareAssessmentBpaDetails(assessmentBpaDetails: any) {
    const processOwner = assessmentBpaDetails.processOwner;
    const user = processOwner ? await this.createBpaService.prepareProcessOwnerData(processOwner) : null;

    const legalBasesId = assessmentBpaDetails.legalBases?.length ? assessmentBpaDetails.legalBases[0] : 0;
    const regulationObj = legalBasesId ? await this.createBpaService.getRegulationFromLegalBasis(legalBasesId) : null;
    let _assessmentBpaDetails: AssessmentBpaDetails = {
      asset: {
        assetId: assessmentBpaDetails?.assetId ?? 0,
        name: assessmentBpaDetails?.name ?? ''
      },
      bpa: {
        bpaId: assessmentBpaDetails?.bpaId ?? 0,
        name: assessmentBpaDetails?.name ?? ''
      },
      processOwner: user ? { ...user } : null,
      regulation: regulationObj ? { ...regulationObj } : null,
      disabled: false
    }
    return _assessmentBpaDetails;
  }

  //Assessment pagination
  getPrevAssessmentShifted() {
    const val = localStorage.getItem(LSK_ASSESSMENT_PREV_SHIFTED);
    return val == 'true' ? true : false
  }

  getPrevAssessmentRid() {
    let result: any = localStorage.getItem(LSK_ASSESSMENT_PREV_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  getAssessmentRid() {
    let result: any = localStorage.getItem(LSK_ASSESSMENT_CURRENT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  setAssessmentRid(data: any) {
    setItem(LSK_ASSESSMENT_CURRENT_RQRID, data);
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_ASSESSMENT_PREV_SHIFTED, value);
  }

  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_ASSESSMENT_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_ASSESSMENT_REQ_FILTER, {
        ...filters,
        page: filters.prevPageNo,
        total: filters.prevPageNo == 1 ? filters.tempTotal : filters.total,
      });
      return
    }
    setItem(LSK_ASSESSMENT_REQ_FILTER, {
      ...filters,
      prevPageNo: prevPageNo,
    });
  }

  getNextOrPrevRequestRid(index: number) {
    try {
      let requestList = this.getAssessmentRid();
      let request = requestList[index];
      return request
    }
    catch (e) {
      return null
    }
  }

  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_ASSESSMENT_NEXT_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  getNextRequestRid() {
    let result: any = localStorage.getItem(LSK_ASSESSMENT_NEXT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  setAssessmentRequestRid(data: any) {
    setItem(LSK_ASSESSMENT_CURRENT_RQRID, data);
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_ASSESSMENT_NEXT_REQ_SHIFTED, value);
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_ASSESSMENT_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_ASSESSMENT_REQ_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_ASSESSMENT_REQ_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_ASSESSMENT_REQ_FILTER);
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

  removePrevAssessmentRid() {
    removeItem(LSK_ASSESSMENT_PREV_RQRID);
  }

  async getAssessmentList(pageNo: number) {
    const filters = getItem(LSK_ASSESSMENT_REQ_FILTER);
    const body = { ...filters, page: pageNo }
    const reqRidList: any[] = []
    const res = await this.apiHelperService.getAssesmentList(body);
    if (res) {
      if (pageNo == 1) {
        const filters = getItem(LSK_ASSESSMENT_REQ_FILTER);
        setItem(LSK_ASSESSMENT_REQ_FILTER, {
          ...filters,
          tempTotal: +(res?.totalItems ?? 0),
        });
      }
      res.assessments.map((item: any) => {
        reqRidList.push({ 'requestRid': item.id, })
      })
    }
    return res ? reqRidList : []
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_ASSESSMENT_PREV_RQRID, data);
  }

  removeNextRequestRid() {
    removeItem(LSK_ASSESSMENT_NEXT_RQRID);
  }

  setNextRequestRid(data: any) {
    setItem(LSK_ASSESSMENT_NEXT_RQRID, data);
  }

  private getListingFilterKey(isVendorContext: boolean): string {
    return isVendorContext ? LSK_VENDOR_ASSESSMENT_FILTER_LISTING : LSK_ASSESSMENT_FILTER_LISTING;
  }

  storeRequestListingFilter(filters: any, isVendorContext: boolean = false) {
    const key = this.getListingFilterKey(isVendorContext);
    const reqFilters = getItem(key)
    const filterData = { ...reqFilters, ...filters };
    setItem(key, filterData);
  }

  getRequestListingFilter(isVendorContext: boolean = false) {
    const key = this.getListingFilterKey(isVendorContext);
    const reqFilters = getItem(key)
    return reqFilters
  }

  clearRequestListingFilters(isVendorContext: boolean = false) {
    const key = this.getListingFilterKey(isVendorContext);
    removeItem(key)
  }

  storeRequestFilter(filters: any) {
    const reqFilters = getItem(LSK_ASSESSMENT_REQ_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_ASSESSMENT_REQ_FILTER, filterData);
  }

  getRequestFilter() {
    const reqFilters = getItem(LSK_ASSESSMENT_REQ_FILTER)
    return reqFilters
  }

  clearRequestFilters() {
    removeItem(LSK_ASSESSMENT_REQ_FILTER)
  }

  clearAssessmentCreationData() {
    this.assessmentTemplateDetail = null;
    this.currentRespondentList = []
    this.deletedApproverList = []
    this.currentApproverList = []
    this.currentAuthor = null
  }

  onDeleteApprover(approver: any) {
    const _approverMappingId = approver?.approverMappingId
    if (_approverMappingId) {
      const exist = this.deletedApproverList.find((approverMappingId: number) => approverMappingId == _approverMappingId);
      if (!exist) {
        this.deletedApproverList.push(_approverMappingId)
      }
    }
  }

  onDeleteAuthor() {
    if (!this.currentAuthor) {
      return
    }
    const _approverUser = (this.currentApproverList ?? []).find((_user: any) => (_user.approver.userId == this.currentAuthor.userId) && (_user.approver.userType == this.currentAuthor.userType) && (_user.level == 1))
    this.onDeleteApprover(_approverUser)
  }

  assessmentIsOpen(status: string) {
    return status === AssessmentStatus.OPEN
  }

  assessmentIsInProgress(status: string) {
    return status === AssessmentStatus.IN_PROGRESS
  }

  assessmentCompleted(status: string) {
    return status === AssessmentStatus.COMPLETED
  }

  assessmentCancelled(status: string) {
    return status === AssessmentStatus.CANCELLED
  }

  assessmentApproved(status: string) {
    return status === AssessmentStatus.APPROVED
  }
}
