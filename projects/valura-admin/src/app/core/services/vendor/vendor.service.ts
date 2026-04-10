import { inject, Injectable } from '@angular/core';
import { LSK_VENDOR_CURRENT_RQRID, LSK_VENDOR_FILTER, LSK_VENDOR_NEXT_REQ_SHIFTED, LSK_VENDOR_NEXT_RQRID, LSK_VENDOR_PREV_REQ_SHIFTED, LSK_VENDOR_PREV_RQRID } from '@admin-core/constants/local-storage-constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { Vendor, VendorPageRequest } from '@admin-core/models/DataDiscovery/Vendor';
import { createVendorCommandType, Status } from '@admin-page/vendor-management/vendors/constant';
import { v1 as uuidv1 } from 'uuid';
import { ALL } from '@admin-page/data-discovery/bpa-listing/constants';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';
@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private apiHelperService = inject(ApiHelperService);

  constructor() { }

  getVendorFilter() {
    const reqFilters = getItem(LSK_VENDOR_FILTER)
    return reqFilters
  }

  clearVendorFilters() {
    removeItem(LSK_VENDOR_FILTER)
  }

  storeVendorFilter(filters: any) {
    const reqFilters = getItem(LSK_VENDOR_FILTER)
    const filterData = { ...reqFilters, ...filters };
    setItem(LSK_VENDOR_FILTER, filterData);
  }

  moveToAllTab() {
    const filterData = { selectedTab: ALL, allVendorCount: 0, isDraft: false };
    this.storeVendorFilter(filterData)
  }

  async getRequestList(pageNo: number) {
    const filters = getItem(LSK_VENDOR_FILTER);
    const body = { ...filters, page: pageNo }
    const reqRidList: VendorPageRequest[] = []
    const res = await this.apiHelperService.getVendorList(body);
    if (res) {
      if (pageNo == 1) {
        const filters = getItem(LSK_VENDOR_FILTER);
        setItem(LSK_VENDOR_FILTER, {
          ...filters,
          tempTotal: +(res?.totalItems ?? 0),
        });
      }
      res.vendors.map((item: Vendor) => {
        reqRidList.push({ 'vendorId': item.id, })
      })
    }
    return res ? reqRidList : []
  }

  setNextRequestRid(data: any) {
    setItem(LSK_VENDOR_NEXT_RQRID, data);
  }

  getNextRequestRid() {
    let result: any = localStorage.getItem(LSK_VENDOR_NEXT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removeNextRequestRid() {
    removeItem(LSK_VENDOR_NEXT_RQRID);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_VENDOR_PREV_RQRID, data);
  }

  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_VENDOR_PREV_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_VENDOR_PREV_RQRID);
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_VENDOR_PREV_REQ_SHIFTED, value);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_VENDOR_PREV_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_VENDOR_NEXT_REQ_SHIFTED, value);
  }

  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_VENDOR_NEXT_REQ_SHIFTED);
    return val == 'true' ? true : false
  }

  setVendorRequestRid(data: any) {
    setItem(LSK_VENDOR_CURRENT_RQRID, data);
  }

  getVendorRid() {
    let result: any = localStorage.getItem(LSK_VENDOR_CURRENT_RQRID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_VENDOR_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_VENDOR_FILTER, {
        ...filters,
        page: filters.prevPageNo,
        total: filters.prevPageNo == 1 ? filters.tempTotal : filters.total,
      });
      return
    }
    setItem(LSK_VENDOR_FILTER, {
      ...filters,
      prevPageNo: prevPageNo,
    });
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_VENDOR_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_VENDOR_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_VENDOR_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  getNextOrPrevRequestRid(index: number) {
    try {
      let requestList = this.getVendorRid();
      let request = requestList[index];
      return request
    }
    catch (e) {
      return null
    }
  }

  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_VENDOR_FILTER);
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
    const filters = getItem(LSK_VENDOR_FILTER);
    setItem(LSK_VENDOR_FILTER, {
      ...filters,
      page: pageNo,
    });
  }

  buildUpdateCommands(formValue: any, original: any, selectedCountry: any): any[] {
    const commands: any[] = [];

    if (formValue.name !== original.name) {
      commands.push({ updateName: formValue.name });
    }

    if ((formValue.description || '') !== (original.description || '')) {
      commands.push({ updateDescription: formValue.description || '' });
    }

    const status = formValue.status ? Status.ACTIVE : Status.INACTIVE;
    if (status !== original.status) {
      commands.push({ updateStatus: status });
    }

    const normalize = (val: any) => (val ?? '').toString().trim();
    const newPhone = normalize(
      formValue.phone ? (selectedCountry?.countryPhoneCode ? `${selectedCountry.countryPhoneCode} ${formValue.phone}` : formValue.phone) : ''
    );
    const oldPhone = normalize(original.vendorContactExternal?.phone);

    const isExternalChanged = normalize(formValue.pointOfContact) !== normalize(original.vendorContactExternal?.name) ||
      normalize(formValue.externalEmail) !== normalize(original.vendorContactExternal?.email) ||
      normalize(formValue.address) !== normalize(original.vendorContactExternal?.address) ||
      normalize(formValue.location) !== normalize(original.vendorContactExternal?.location) ||
      newPhone !== oldPhone;

    if (isExternalChanged) {
      commands.push({
        updateContactExternal: {
          name: normalize(formValue.pointOfContact),
          email: normalize(formValue.externalEmail),
          address: normalize(formValue.address),
          location: Number(normalize(formValue.location)),
          phone: newPhone || null,
        }
      });
    }

    if (formValue.businessSpocName !== original.vendorContactInternal?.businessSPOCName || formValue.internalEmail !== original.vendorContactInternal?.email) {
      commands.push({
        updateContactInternal: {
          businessSPOCName: formValue.businessSpocName || '',
          email: formValue.internalEmail || '',
        }
      });
    }

    if (formValue.vendorType?.id !== original.vendorType?.id) {
      commands.push({
        updateVendorType: {
          id: formValue.vendorType?.id || 0,
          name: formValue.vendorType?.name || '',
        }
      });
    }

    if (formValue.serviceType?.id !== original.serviceType?.id) {
      commands.push({
        updateServiceType: {
          id: formValue.serviceType?.id,
          name: formValue.serviceType?.name
        }
      });
    }

    return commands;
  }
}

export const buildVendorStatusUpdateCommand = (status: string) => {
  const _command = {
    commandId: uuidv1(),
    commands: [
      {
        [createVendorCommandType.UpdateStatus]: status
      }
    ]
  }
  return _command
}