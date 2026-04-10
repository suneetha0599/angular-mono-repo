import { inject, Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { DataSubject } from '@admin-core/models/DataDiscovery/Asset';
import { PdElements } from '@admin-core/models/configuration/regulation';
import { LSK_ASSET_CURRENT_RID, LSK_ASSET_NEXT_RID, LSK_ASSET_NEXT_SHIFTED, LSK_ASSET_PREV_RID, LSK_ASSET_PREV_SHIFTED, LSK_ASSET_REQ_FILTER, LSK_ASSET_REQ_LISTING_FILTER, } from '@admin-core/constants/local-storage-constants';
import { ApiHelperService } from '../network/api-helper.service';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  dataSubjectList!: DataSubject[];
  pdElementsList!: PdElements[];
  departmentList: any[] = [];

  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);
  private apiHelperService = inject(ApiHelperService)

  constructor() { }

  getAssetFilter() {
    const reqFilters = getItem(LSK_ASSET_REQ_FILTER)
    return reqFilters
  }

  clearAssetFilters() {
    removeItem(LSK_ASSET_REQ_FILTER)
  }

  storeAssetFilter(filters: any) {
    const reqFilters = getItem(LSK_ASSET_REQ_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_ASSET_REQ_FILTER, filterData);
  }


  getAssetListingFilter() {
    const reqFilters = getItem(LSK_ASSET_REQ_LISTING_FILTER)
    return reqFilters
  }

  clearAssetListingFilters() {
    removeItem(LSK_ASSET_REQ_LISTING_FILTER)
  }

  storeAssetListingFilter(filters: any) {
    const reqFilters = getItem(LSK_ASSET_REQ_LISTING_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_ASSET_REQ_LISTING_FILTER, filterData);
  }

  async getDataSubjectList(forceLoad: boolean = false, id: number) {
    let dataSubject = await this.dbService.getDataSubjectById(id);
    if (forceLoad || !dataSubject || (Array.isArray(dataSubject) && dataSubject.length === 0)) {
      const res = await this.downloadConfigService.getDataSubjectsList();
      dataSubject = await this.dbService.getDataSubjectById(id);
    }
    const dataSubjectList = dataSubject ? [dataSubject] : [];

    this.dataSubjectList = dataSubjectList;
    return dataSubjectList;
  }

  async getPDElementsList(forceLoad: boolean = false, id: number) {
    let pdElements = await this.dbService.getPdElementsById(id);
    if (forceLoad) {
      const res = await this.downloadConfigService.getPdElementList();
      pdElements = await this.dbService.getPdElementsById(id);
    }
    const pdElementsList = pdElements ? [pdElements] : [];
    this.pdElementsList = pdElementsList;
    return pdElementsList;
  }

  async getDepartmentList(forceLoad: boolean = false) {
    let department = await this.dbService.getAllDepartments();
    if (forceLoad || department.length === 0) {
      const res = await this.downloadConfigService.getDepartmentList();
      department = await this.dbService.getAllDepartments();
    }
    const departmentList = department ? department : [];
    this.departmentList = departmentList;
    return departmentList;
  }


  setDsrRequestRid(data: any) {
    setItem(LSK_ASSET_CURRENT_RID, data);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_ASSET_PREV_SHIFTED);
    return val == 'true' ? true : false
  }

  getDsrRequestRid() {
    let result: any = localStorage.getItem(LSK_ASSET_CURRENT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_ASSET_PREV_RID);
  }


  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_ASSET_PREV_RID)
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
    let result: any = localStorage.getItem(LSK_ASSET_NEXT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }
  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_ASSET_NEXT_SHIFTED);
    return val == 'true' ? true : false
  }
  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_ASSET_REQ_FILTER);
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
    const filters = getItem(LSK_ASSET_REQ_FILTER);
    setItem(LSK_ASSET_REQ_FILTER, {
      ...filters,
      page: pageNo,
    });
  }


  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_ASSET_REQ_FILTER) || {};

    if (isSetToPageNo) {
      const pageToSet = prevPageNo > 0 ? prevPageNo : (filters.prevPageNo || 1);

      setItem(LSK_ASSET_REQ_FILTER, {
        ...filters,
        page: pageToSet,
        total:
          pageToSet === 1 && filters.tempTotal > 0
            ? filters.tempTotal
            : filters.total,
      });
      return;
    }

    setItem(LSK_ASSET_REQ_FILTER, {
      ...filters,
      prevPageNo,
    });
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_ASSET_PREV_SHIFTED, value);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_ASSET_PREV_RID, data);
  }
  removeNextRequestRid() {
    removeItem(LSK_ASSET_NEXT_RID);
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_ASSET_REQ_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_ASSET_REQ_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_ASSET_REQ_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_ASSET_NEXT_SHIFTED, value);
  }
  setNextRequestRid(data: any) {
    setItem(LSK_ASSET_NEXT_RID, data);
  }



  async getRequestList(pageNo: number) {
    const filters = getItem(LSK_ASSET_REQ_FILTER);
    const body = { ...filters, page: pageNo }
    const reqRidList: any[] = []
    const res = await this.apiHelperService.getAssetList(body);
    if (res) {
      if (pageNo == 1) {
        const filters = getItem(LSK_ASSET_REQ_FILTER);
        setItem(LSK_ASSET_REQ_FILTER, {
          ...filters,
          tempTotal: +(res?.totalItems ?? 0),
        });
      }
      res.assets.map((item: any) => {
        reqRidList.push({ 'assetId': item.assetId, })
      })
    }
    return res ? reqRidList : []
  }


  clearAssetNavigationState() {
    removeItem(LSK_ASSET_PREV_RID);
    removeItem(LSK_ASSET_NEXT_RID);
    removeItem(LSK_ASSET_PREV_SHIFTED);
    removeItem(LSK_ASSET_NEXT_SHIFTED);
    removeItem(LSK_ASSET_REQ_FILTER);
    removeItem(LSK_ASSET_CURRENT_RID);
  }


}
