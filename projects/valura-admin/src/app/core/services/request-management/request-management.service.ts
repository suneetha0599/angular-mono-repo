import { inject, Injectable } from '@angular/core';
import { ASSIGNED, DOCUMENT_RECEIVED, DOCUMENT_REQUESTED_FOR_FURTHER_VERIFICATION, DOCUMENT_VERIFIED, FORM_REJECTED, REQUEST_CANCELLED, REQUEST_STAGES, REQUEST_VERIFICATION_PENDING, RequestDisplayStage, RequestTaskStage, StageMetaData } from '../../../pages/request-management/constant';
import { LSK_DSR_CURRENT_RQRID, LSK_DSR_REQ_FILTER, LSK_DSR_NEXT_REQ_SHIFTED, LSK_DSR_NEXT_RQRID, LSK_DSR_PREV_REQ_SHIFTED, LSK_DSR_PREV_RQRID, ROUTE_BACK, REQUEST_STAGE, LSK_DSR_REQ_FILTER_LISTING } from '@admin-core/constants/local-storage-constants';
import { ApiHelperService } from '../network/api-helper.service';
import { DsrPageRequest, DsrRequest, DsrRequestDetails, StageMeta } from '../../models/request-management/DsrRequest';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { UserService } from '../user/user.service';
import { PdElementService } from '../pdElement/pd-element.service';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class RequestManagementService {


  constructor(private apiHelperService: ApiHelperService) { }

  dataSubject: any[] = [];


  private dbService = inject(DbService);
  private userService = inject(UserService);
  private downloadConfigService = inject(DownloadConfigService);
  private pdElementService = inject(PdElementService);


  async getDatasubjectMasterList(forceLoad: boolean = false) {
    let dataSubjectMasterList = await this.dbService.getAllDatasubject();
    if (forceLoad || !dataSubjectMasterList) {
      const res = await this.downloadConfigService.getDataSubjectsList();
      let dataSubjectList = await this.dbService.getAllDatasubject();
      dataSubjectMasterList = [...dataSubjectList]
    }
    this.dataSubject = [...dataSubjectMasterList]
    return dataSubjectMasterList ?? []
  }

  showDocumentRequestBtn(state: string) {
    return (state == REQUEST_VERIFICATION_PENDING || state == DOCUMENT_REQUESTED_FOR_FURTHER_VERIFICATION || state == DOCUMENT_RECEIVED)
  }

  showRequestVerificationBtn(state: string) {
    return (state == REQUEST_VERIFICATION_PENDING || state == DOCUMENT_VERIFIED || state == ASSIGNED)
  }

  showDocumentVerificationBtn(state: string) {
    return (state == DOCUMENT_RECEIVED)
  }

  verificationCurrentStage(stageMeta: StageMeta) {
    return stageMeta.verification === StageMetaData.CURRENT_STAGE
  }

  validationCurrentStage(stageMeta: StageMeta) {
    return stageMeta.validation === StageMetaData.CURRENT_STAGE
  }

  dataMappingCurrentStage(stageMeta: StageMeta) {
    return stageMeta.dataMapping === StageMetaData.CURRENT_STAGE
  }

  datafulfillmentCurrentStage(stageMeta: StageMeta) {
    return stageMeta.dataFulfilment === StageMetaData.CURRENT_STAGE
  }

  auditCloseCurrentStage(stageMeta: StageMeta) {
    return stageMeta.auditAndClose === StageMetaData.CURRENT_STAGE
  }

  validationCompleted(stageMeta: StageMeta) {
    return stageMeta.validation === StageMetaData.COMPLETED
  }

  dataFulfillmentCompleted(stageMeta: StageMeta) {
    return stageMeta.dataFulfilment === StageMetaData.COMPLETED
  }

  validationRejected(stageMeta: StageMeta) {
    return stageMeta.validation === StageMetaData.REJECTED
  }

  dataFulfillmentRejected(stageMeta: StageMeta) {
    return stageMeta.dataFulfilment === StageMetaData.REJECTED
  }

  requestCancelledorRejected(state: string): boolean {
    return (state == FORM_REJECTED || state == REQUEST_CANCELLED)
  }

  getRequestVerificationStage(stageMeta: StageMeta, stageCompleted: boolean) {
    let key: string = "";
    let progressBar: number = 0;
    let allStageCompleted: boolean = false;

    if (this.verificationCurrentStage(stageMeta)) {
      key = RequestDisplayStage.REQUEST_VERIFICATION
      progressBar = 0
    }

    else if (this.validationCurrentStage(stageMeta)) {
      key = RequestDisplayStage.REQUEST_VALIDATION
      progressBar = 25
    }

    else if (this.dataMappingCurrentStage(stageMeta)) {
      key = RequestDisplayStage.DATA_DISCOVERY
      progressBar = 50
    }

    else if (this.datafulfillmentCurrentStage(stageMeta)) {
      key = RequestDisplayStage.REQUEST_FULFILLMENT
      progressBar = 50
    }

    else if (this.auditCloseCurrentStage(stageMeta)) {
      key = RequestDisplayStage.AUDIT_AND_CLOSE
      progressBar = 100
    }

    else {
      if (stageCompleted) {
        key = RequestDisplayStage.AUDIT_AND_CLOSE
        progressBar = 100
        allStageCompleted = true
      }
    }
    return [key, progressBar, allStageCompleted]
  }

  setDsrRequestRid(data: any) {
    setItem(LSK_DSR_CURRENT_RQRID, data);
  }

  getDsrRequestRid() {
    let result: any = localStorage.getItem(LSK_DSR_CURRENT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removeDsrReqRid() {
    localStorage.removeItem(LSK_DSR_CURRENT_RQRID)
  }

  deleteDsrRequestRid(requestRid: number) {
    try {
      let requestList = this.getDsrRequestRid();
      let findIndex = requestList.findIndex((request: DsrRequest) => request.id == requestRid);
      if (findIndex > -1) {
        requestList.splice(findIndex, 1);
      }
      this.setDsrRequestRid(requestList)
    }
    catch (e) { }
  }

  getNextOrPrevRequestRid(index: number) {
    try {
      let requestList = this.getDsrRequestRid();
      let request = requestList[index];
      return request
    }
    catch (e) {
      return null
    }
  }

  async getRequestList(pageNo: number) {
    const filters = getItem(LSK_DSR_REQ_FILTER);
    const body = { ...filters, page: pageNo }
    const reqRidList: DsrPageRequest[] = []
    const res = await this.apiHelperService.getDsrRequestsList(body);
    if (res) {
      if (pageNo == 1) {
        const filters = getItem(LSK_DSR_REQ_FILTER);
        setItem(LSK_DSR_REQ_FILTER, {
          ...filters,
          tempTotal: +(res?.totalItems ?? 0),
        });
      }
      res.dsrRequestListings.map((item: DsrRequest) => {
        reqRidList.push({ 'requestRid': item.id, })
      })
    }
    return res ? reqRidList : []
  }

  setNextRequestRid(data: any) {
    setItem(LSK_DSR_NEXT_RQRID, data);
  }

  getNextRequestRid() {
    let result: any = localStorage.getItem(LSK_DSR_NEXT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removeNextRequestRid() {
    removeItem(LSK_DSR_NEXT_RQRID);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_DSR_PREV_RQRID, data);
  }

  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_DSR_PREV_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_DSR_PREV_RQRID);
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_DSR_PREV_REQ_SHIFTED, value);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_DSR_PREV_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_DSR_NEXT_REQ_SHIFTED, value);
  }

  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_DSR_NEXT_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_DSR_REQ_FILTER);
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

  setNextRequestPageNo(pageNo: number) {
    const filters = getItem(LSK_DSR_REQ_FILTER);
    setItem(LSK_DSR_REQ_FILTER, {
      ...filters,
      page: pageNo,
    });
  }

  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_DSR_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_DSR_REQ_FILTER, {
        ...filters,
        page: filters.prevPageNo,
        total: filters.prevPageNo == 1 ? filters.tempTotal : filters.total,
      });
      return
    }
    setItem(LSK_DSR_REQ_FILTER, {
      ...filters,
      prevPageNo: prevPageNo,
    });
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_DSR_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_DSR_REQ_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_DSR_REQ_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }


  removePrevOrNextNodeData() {
    this.removeDsrReqRid();
    this.removeNextRequestRid();
    this.removePrevRequestRid();
    localStorage.removeItem(LSK_DSR_PREV_REQ_SHIFTED);
    localStorage.removeItem(LSK_DSR_NEXT_REQ_SHIFTED);
  }


  markVerificationStage(stageIndex: number, stageMeta: StageMeta) {
    if (stageIndex == REQUEST_STAGES[0].stage) {
      return stageMeta.verification
    }

    if (stageIndex == REQUEST_STAGES[1].stage) {
      return stageMeta.validation
    }

    if (stageIndex == REQUEST_STAGES[2].stage) {
      return stageMeta.dataMapping
    }

    if (stageIndex == REQUEST_STAGES[3].stage) {
      return stageMeta.dataFulfilment
    }

    if (stageIndex == REQUEST_STAGES[4].stage) {
      return stageMeta.auditAndClose
    }
    return 0
  }

  getStageForTask(stage: string): string {
    switch (stage) {
      case RequestDisplayStage.REQUEST_VERIFICATION:
        return RequestTaskStage.REQUEST_VERIFICATION;

      case RequestDisplayStage.REQUEST_VALIDATION:
        return RequestTaskStage.REQUEST_VALIDATION;


      case RequestDisplayStage.DATA_DISCOVERY:
        return RequestTaskStage.DATA_DISCOVERY;

      case RequestDisplayStage.REQUEST_FULFILLMENT:
        return RequestTaskStage.REQUEST_FULFILLMENT;

      default:
        console.warn(`Unknown stage: ${stage}, defaulting to REQUEST_VERIFICATION`);
        return RequestTaskStage.REQUEST_VERIFICATION;
    }
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

  setRequestStage(stage: string) {
    setItem(REQUEST_STAGE, stage)
  }

  get requestStage() {
    return getItem(REQUEST_STAGE)
  }

  deleteRequestStage() {
    removeItem(REQUEST_STAGE)
  }

  storeRequestListingFilter(filters: any) {
    const reqFilters = getItem(LSK_DSR_REQ_FILTER_LISTING)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_DSR_REQ_FILTER_LISTING, filterData);
  }

  getRequestListingFilter() {
    const reqFilters = getItem(LSK_DSR_REQ_FILTER_LISTING)
    return reqFilters
  }

  clearRequestListingFilters() {
    removeItem(LSK_DSR_REQ_FILTER_LISTING)
  }

  storeRequestFilter(filters: any) {
    const reqFilters = getItem(LSK_DSR_REQ_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_DSR_REQ_FILTER, filterData);
  }

  getRequestFilter() {
    const reqFilters = getItem(LSK_DSR_REQ_FILTER)
    return reqFilters
  }

  clearRequestFilters() {
    removeItem(LSK_DSR_REQ_FILTER)
  }


  async processRequestDetails(dsrRequestDetails: DsrRequestDetails) {
    const dsverifiedUserId = dsrRequestDetails?.processingDetails?.verification?.dsVerificationDetails?.identityVerifiedBy?.userId
    if (dsverifiedUserId) {
      const user = await this.userService.getUserById(dsverifiedUserId)
      dsrRequestDetails.processingDetails.verification.dsVerificationDetails.identityVerifiedBy.displayName = (user?.displayName ?? '')
    }
    const thirdPartyverifiedUserId = dsrRequestDetails?.processingDetails?.verification?.thirdPartyVerificationDetails?.identityVerifiedBy?.userId
    if (thirdPartyverifiedUserId) {
      const user = await this.userService.getUserById(thirdPartyverifiedUserId)
      dsrRequestDetails.processingDetails.verification.thirdPartyVerificationDetails.identityVerifiedBy.displayName = (user?.displayName ?? '')
    }
    const extensionRequestedBy = +(dsrRequestDetails?.extensionDetails?.extensionRequestedBy ?? 0);
    if (extensionRequestedBy) {
      const user = await this.userService.getUserById(extensionRequestedBy)
      dsrRequestDetails.extensionDetails.extensionRequestedByUserName = (user?.displayName ?? '')
    }
    return dsrRequestDetails
  }

  async preparePdMappingList(dataSubjectList: any) {
    let _pdMappingList: any = []
    for (const ds of dataSubjectList) {
      for (const pdMapping of ds.pdMappingLists) {
        const pdId = pdMapping.pdId ?? 0;
        const _pdElement = await this.pdElementService.getPdElementById(pdId)
        const data = {
          id: pdId,
          name: _pdElement?.name || 'N/A',
          categoryMappings: _pdElement?.categoryMappings?.length ? _pdElement?.categoryMappings : '',
          assetCount: pdMapping.assetInvolved?.length || 0,
          assetInvolvedList: pdMapping.assetInvolved || []
        }
        _pdMappingList.push(data)
      }
    }
    return _pdMappingList
  }
}


