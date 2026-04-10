import { Injectable } from '@angular/core';
import { LSK_ROLE_CURRENT_RID, LSK_ROLE_FILTER, LSK_ROLE_NEXT_RID, LSK_ROLE_NEXT_SHIFTED, LSK_ROLE_PREV_RID, LSK_ROLE_PREV_SHIFTED } from '@admin-core/constants/local-storage-constants';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor() { }


  setDsrRequestRid(data: any) {
    setItem(LSK_ROLE_CURRENT_RID, data);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_ROLE_PREV_SHIFTED);
    return val == 'true' ? true : false
  }

  getDsrRequestRid() {
    let result: any = localStorage.getItem(LSK_ROLE_CURRENT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_ROLE_PREV_RID);
  }


  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_ROLE_PREV_RID)
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
    let result: any = localStorage.getItem(LSK_ROLE_NEXT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }
  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_ROLE_NEXT_SHIFTED);
    return val == 'true' ? true : false
  }
  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_ROLE_FILTER);
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
    const filters = getItem(LSK_ROLE_FILTER);
    setItem(LSK_ROLE_FILTER, {
      ...filters,
      page: pageNo,
    });
  }


  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_ROLE_FILTER) || {};

    if (isSetToPageNo) {
      const pageToSet = prevPageNo > 0 ? prevPageNo : (filters.prevPageNo || 1);

      setItem(LSK_ROLE_FILTER, {
        ...filters,
        page: pageToSet,
        total:
          pageToSet === 1 && filters.tempTotal > 0
            ? filters.tempTotal
            : filters.total,
      });
      return;
    }

    setItem(LSK_ROLE_FILTER, {
      ...filters,
      prevPageNo,
    });
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_ROLE_PREV_SHIFTED, value);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_ROLE_PREV_RID, data);
  }
  removeNextRequestRid() {
    removeItem(LSK_ROLE_NEXT_RID);
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_ROLE_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_ROLE_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_ROLE_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_ROLE_NEXT_SHIFTED, value);
  }
  setNextRequestRid(data: any) {
    setItem(LSK_ROLE_NEXT_RID, data);
  }





  clearRoleNavigationState() {
    removeItem(LSK_ROLE_PREV_RID);
    removeItem(LSK_ROLE_NEXT_RID);
    removeItem(LSK_ROLE_PREV_SHIFTED);
    removeItem(LSK_ROLE_NEXT_SHIFTED);
    removeItem(LSK_ROLE_FILTER);
  }

}
