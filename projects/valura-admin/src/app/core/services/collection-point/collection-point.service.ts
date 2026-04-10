import { inject, Injectable } from '@angular/core';
import { DataSubjectService } from '@admin-core/services/dataSubject/data-subject.service';
import { PdElementService } from '@admin-core/services/pdElement/pd-element.service';
import { LSK_COLL_POINT_CURRENT_RQRID, LSK_COLL_POINT_NEXT_REQ_SHIFTED, LSK_COLL_POINT_NEXT_RQRID, LSK_COLL_POINT_PREV_REQ_SHIFTED, LSK_COLL_POINT_PREV_RQRID, LSK_COLLECTION_POINT_FILTER } from '@admin-core/constants/local-storage-constants';
import { CollectionPointPdMapping, DataElement } from '@admin-page/data-discovery/collection-point/collection-point-details/collection-point-details.component';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { CollectionPoint, CollectionPointId } from '@admin-core/models/data-inventory/BPA';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class CollectionPointService {
  private apiHelperService = inject(ApiHelperService);

  constructor(private dataSubjectService: DataSubjectService, private pdElementService: PdElementService,) { }

  getCollectionPointFilter() {
    const reqFilters = getItem(LSK_COLLECTION_POINT_FILTER)
    return reqFilters
  }

  clearCollectionPointFilter() {
    removeItem(LSK_COLLECTION_POINT_FILTER)
  }

  storeCollectionPointFilter(filters: any) {
    const reqFilters = getItem(LSK_COLLECTION_POINT_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_COLLECTION_POINT_FILTER, filterData);
  }




  async prepareDataElements(dataElementResponse: CollectionPointPdMapping[]) {
    const pdElementMappingList: DataElement[] = []
    for (const ds of dataElementResponse) {
      if (pdElementMappingList.find(pd => pd?.pdId == ds.pdId) || !ds.pdId) {
        continue
      }

      const _dataSubject = await this.dataSubjectService.getDataSubjectById(ds?.dsId ?? 0);
      const _pdElement = await this.pdElementService.getPdElementById(ds.pdId ?? 0);
      const data: any = { name: (_pdElement?.name ?? ''), dataClassification: _pdElement?.classificationMappings, dataCategory: _pdElement?.categoryMappings, pdId: _pdElement?.id }
      pdElementMappingList.push(data)
    }
    return pdElementMappingList
  }


  async getRequestList(pageNo: number) {
    const filters = getItem(LSK_COLLECTION_POINT_FILTER);
    const body = { ...filters, page: pageNo }
    const reqRidList: CollectionPointId[] = []
    const res = await this.apiHelperService.getCollectionPoints(body);
    if (res) {
      if (pageNo == 1) {
        const filters = getItem(LSK_COLLECTION_POINT_FILTER);
        setItem(LSK_COLLECTION_POINT_FILTER, {
          ...filters,
          tempTotal: +(res?.totalItems ?? 0),
        });
      }
      res.sourceListing.map((item: CollectionPoint) => {
        reqRidList.push({ 'id': item.id, })
      })
    }
    return res ? reqRidList : []
  }

  setNextRequestRid(data: any) {
    setItem(LSK_COLL_POINT_NEXT_RQRID, data);
  }

  getNextRequestRid() {
    let result: any = localStorage.getItem(LSK_COLL_POINT_NEXT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removeNextRequestRid() {
    removeItem(LSK_COLL_POINT_NEXT_RQRID);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_COLL_POINT_PREV_RQRID, data);
  }

  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_COLL_POINT_PREV_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_COLL_POINT_PREV_RQRID);
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_COLL_POINT_PREV_REQ_SHIFTED, value);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_COLL_POINT_PREV_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_COLL_POINT_NEXT_REQ_SHIFTED, value);
  }

  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_COLL_POINT_NEXT_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  setCOLLPOINTRequestRid(data: any) {
    setItem(LSK_COLL_POINT_CURRENT_RQRID, data);
  }

  getCollectionPointRid() {
    let result: any = localStorage.getItem(LSK_COLL_POINT_CURRENT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_COLLECTION_POINT_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_COLLECTION_POINT_FILTER, {
        ...filters,
        page: filters.prevPageNo,
        total: filters.prevPageNo == 1 ? filters.tempTotal : filters.total,
      });
      return
    }
    setItem(LSK_COLLECTION_POINT_FILTER, {
      ...filters,
      prevPageNo: prevPageNo,
    });
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_COLLECTION_POINT_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_COLLECTION_POINT_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_COLLECTION_POINT_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  getNextOrPrevRequestRid(index: number) {
    try {
      let requestList = this.getCollectionPointRid();
      let request = requestList[index];
      return request
    }
    catch (e) {
      return null
    }
  }

  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_COLLECTION_POINT_FILTER);
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

}
