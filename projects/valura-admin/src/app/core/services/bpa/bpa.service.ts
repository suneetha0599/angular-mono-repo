import { inject, Injectable } from '@angular/core';
import { BpaDataSubject } from '../../models/data-inventory/BPA';
import { LSK_BPA_CURRENT_RID, LSK_BPA_NEXT_RID, LSK_BPA_NEXT_SHIFTED, LSK_BPA_PREV_RID, LSK_BPA_PREV_SHIFTED, LSK_BPA_REQ_FILTER, LSK_BPA_REQ_LISTING_FILTER, LSK_DATA_SUBJECT } from '@admin-core/constants/local-storage-constants';
import { RegulationsService } from '../regulations/regulations.service';
import { LegalGroundService } from '../legal-ground/legal-ground.service';
import { BehaviorSubject } from 'rxjs';
import { ApiHelperService } from '../network/api-helper.service';
import { getItem, getList, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class BpaService {

  private regulationsService = inject(RegulationsService);
  private legalGroundService = inject(LegalGroundService);
  private apiHelperService = inject(ApiHelperService)

  isEditMode: boolean = false;
  formTouched: boolean = true;
  departmentList: any[] = [];
  countryList: any[] = []
  regulationList: any = []
  legalBasisList: any = []
  public updateEditMode$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  setDataSubject(dataSubjectList: BpaDataSubject[]) {
    setItem(LSK_DATA_SUBJECT, dataSubjectList)
  }

  getDataSubject() {
    return getList(LSK_DATA_SUBJECT)
  }

  clearDataSubject() {
    removeItem(LSK_DATA_SUBJECT)
  }

  getBpaListingFilter() {
    const reqFilters = getItem(LSK_BPA_REQ_LISTING_FILTER)
    return reqFilters
  }

  clearBpaListingFilters() {
    removeItem(LSK_BPA_REQ_LISTING_FILTER)
  }

  storeBpaListingFilter(filters: any) {
    const reqFilters = getItem(LSK_BPA_REQ_LISTING_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_BPA_REQ_LISTING_FILTER, filterData);
  }



  getBpaFilter() {
    const reqFilters = getItem(LSK_BPA_REQ_FILTER)
    return reqFilters
  }

  clearBpaFilters() {
    removeItem(LSK_BPA_REQ_FILTER)
  }

  storeBpaFilter(filters: any) {
    const reqFilters = getItem(LSK_BPA_REQ_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_BPA_REQ_FILTER, filterData);
  }

  async getRegulationList(forceLoad: boolean = false) {
    const regulationList = await this.regulationsService.getRegulationMasterList(forceLoad)
    this.regulationList = regulationList;
    return regulationList;
  }

  async getLegalBasisList(forceLoad: boolean = false) {
    const legalBasisList = await this.legalGroundService.getPdElementMasterList(forceLoad)
    this.legalBasisList = legalBasisList;
    return legalBasisList;
  }

  updateBpaMode(mode: boolean = false) {
    this.isEditMode = mode;
    this.updateEditMode$.next(mode)
  }

  setDsrRequestRid(data: any) {
    setItem(LSK_BPA_CURRENT_RID, data);
  }


  clearAssetNavigationState() {
    removeItem(LSK_BPA_PREV_RID);
    removeItem(LSK_BPA_NEXT_RID);
    removeItem(LSK_BPA_PREV_SHIFTED);
    removeItem(LSK_BPA_NEXT_SHIFTED);
    removeItem(LSK_BPA_REQ_FILTER);
  }



  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_BPA_PREV_SHIFTED);
    return val == 'true' ? true : false
  }

  getDsrRequestRid() {
    let result: any = localStorage.getItem(LSK_BPA_CURRENT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_BPA_PREV_RID);
  }


  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_BPA_PREV_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
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


  getNextRequestRid() {
    let result: any = localStorage.getItem(LSK_BPA_NEXT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }
  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_BPA_NEXT_SHIFTED);
    return val == 'true' ? true : false
  }
  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_BPA_REQ_FILTER);
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
    const filters = getItem(LSK_BPA_REQ_FILTER);
    setItem(LSK_BPA_REQ_FILTER, {
      ...filters,
      page: pageNo,
    });
  }


  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_BPA_REQ_FILTER) || {};

    if (isSetToPageNo) {
      const pageToSet = prevPageNo > 0 ? prevPageNo : (filters.prevPageNo || 1);

      setItem(LSK_BPA_REQ_FILTER, {
        ...filters,
        page: pageToSet,
        total:
          pageToSet === 1 && filters.tempTotal > 0
            ? filters.tempTotal
            : filters.total,
      });
      return;
    }

    setItem(LSK_BPA_REQ_FILTER, {
      ...filters,
      prevPageNo,
    });
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_BPA_PREV_SHIFTED, value);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_BPA_PREV_RID, data);
  }
  removeNextRequestRid() {
    removeItem(LSK_BPA_NEXT_RID);
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_BPA_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_BPA_REQ_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_BPA_REQ_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_BPA_NEXT_SHIFTED, value);
  }
  setNextRequestRid(data: any) {
    setItem(LSK_BPA_NEXT_RID, data);
  }



  async getRequestList(pageNo: number) {
    const filters = getItem(LSK_BPA_REQ_FILTER);
    const body = { ...filters, page: pageNo }
    const reqRidList: any[] = []
    const res = await this.apiHelperService.getBpaActivityList(body);
    if (res) {
      if (pageNo == 1) {
        const filters = getItem(LSK_BPA_REQ_FILTER);
        setItem(LSK_BPA_REQ_FILTER, {
          ...filters,
          tempTotal: +(res?.totalItems ?? 0),
        });
      }
      res.listingBPA.map((item: any) => {
        reqRidList.push({ 'bpaId': item.bpaId, })
      })
    }
    return res ? reqRidList : []
  }

}

