import { inject, Injectable } from '@angular/core';
import { Country } from '@admin-core/models/configuration/regulation';
import { DbService } from '../db/db.service';
import { DownloadConfigService } from '../download/download-config.service';
import { LSK_COUNTRY_CURRENT_RID, LSK_COUNTRY_FILTER, LSK_COUNTRY_NEXT_RID, LSK_COUNTRY_NEXT_SHIFTED, LSK_COUNTRY_PREV_RID, LSK_COUNTRY_PREV_SHIFTED } from '@admin-core/constants/local-storage-constants';
import { getItem, removeItem, setItem } from '@valura-lib/utils/local-storage-util';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  countryMasterList: Country[] = []

  constructor() { }


  private dbService = inject(DbService);
  private downloadConfigService = inject(DownloadConfigService);

  async getCountryMasterList(forceLoad: boolean = false) {
    let countryList = await this.dbService.getAllCountry(true);

    if (forceLoad || !countryList?.length) {
      const res = await this.downloadConfigService.getCountryMasterList();
      let _countryList = await this.dbService.getAllCountry(true);
      countryList = [..._countryList]
    }
    this.countryMasterList = [...countryList]
    return countryList ?? [];
  }

  async addCountry(country: Country) {
    await this.dbService.addCountry(country);
  }

  async addBulkCountries(countries: Country[]): Promise<number> {
    return this.dbService.addBulkCountry(countries);
  }

  createCountryObj(country: Country) {
    const newCountry: Country = {
      ...country
    };
    return newCountry
  }

  async createAndNewCountry(country: Country) {
    const newCountry = this.createCountryObj(country)
    await this.addCountry(newCountry);
    return newCountry
  }

  async createAndAddCountry(country: Country): Promise<Country> {
    const newCountry = this.createCountryObj(country);
    await this.addCountry(newCountry);
    return newCountry;
  }

  async updateCountryToDb(countryId: number, countryDetails: any) {
    const updated = await this.dbService.updateCountry(countryId, countryDetails);
    return updated;
  }

  async updateCountryDetailsDb(countryId: number, countryDetail: any) {
    let tempCountryDetail = null;
    tempCountryDetail = await this.dbService.getCountryById(countryId);
    const _tempCounrtyDetail = { ...tempCountryDetail, ...countryDetail }
    const updated = await this.dbService.updateCountry(countryId, _tempCounrtyDetail);
  }

  async deleteCountry(countryId: number) {
    await this.dbService.deleteCountry(countryId);
  }

  async getCountryById(countryId: number) {
    const country = await this.dbService.getCountryById(countryId);
    return country
  }

  async getCountries(
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ): Promise<Country[]> {

    const { sortBy, sortDirection, searchText } = filters;
    let countryList = await this.dbService.getAllCountry() || [];

    if (searchText && searchText.trim()) {
      const text = searchText.trim().toLowerCase();

      countryList = countryList.filter((country: Country) =>
        (country.name ?? "").toLowerCase().includes(text) ||
        (country.countryCode ?? "").toLowerCase().includes(text) ||
        (country.countryPhoneCode ?? "").toLowerCase().includes(text)
      );

    }

    if (sortBy) {
      countryList = countryList.sort((a: any, b: any) => {
        const aValue = (a[sortBy] ?? "").toString().toLowerCase();
        const bValue = (b[sortBy] ?? "").toString().toLowerCase();

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? 1 : -1

        return 0;
      });
    }
    this.countryMasterList = countryList;
    return countryList;

  }

  async createCountryWithApi(countryData: any, apiHelperService: any): Promise<Country | null> {
    try {
      const response: any = await new Promise((resolve, reject) => {
        apiHelperService.createCountry(countryData).subscribe({
          next: (res: any) => resolve(res),
          error: (err: any) => reject(err)
        });
      });

      if (response) {
        let newCountry: Country;
        if (response.country) {
          newCountry = response.country;
        } else if (response.data && response.data.country) {
          newCountry = response.data.country;
        } else if (response.data) {
          newCountry = response.data;
        } else {
          newCountry = response;
        }

        if (!newCountry.id) {
          console.error('Country object does not have an ID:', newCountry);
          throw new Error('Invalid API response: missing country ID');
        }

        await this.addCountry(newCountry);

        this.countryMasterList.push(newCountry);

        return newCountry;
      }
      return null;
    } catch (error) {
      console.error('Error creating country:', error);
      throw error;
    }
  }

  async updateCountryWithApi(countryId: number, countryData: any, apiHelperService: any): Promise<Country | null> {
    try {
      const response = await apiHelperService.updateCountry(countryId, countryData);

      if (response) {
        const updatedCountry = { ...countryData, id: countryId };

        await this.updateCountryToDb(countryId, updatedCountry);
        const index = this.countryMasterList.findIndex(c => c.id === countryId);
        if (index !== -1) {
          this.countryMasterList[index] = { ...this.countryMasterList[index], ...updatedCountry };
        }

        return updatedCountry as Country;
      }
      return null;
    } catch (error) {
      console.error('Error updating country:', error);
      throw error;
    }
  }

  async deleteCountryWithApi(countryId: number, apiHelperService: any): Promise<any> {
    try {
      const response = await apiHelperService.deleteCountry(countryId);

      if (response) {
        await this.deleteCountry(countryId);

        this.countryMasterList = this.countryMasterList.filter(c => c.id !== countryId);

        return response;
      }
      return null;
    } catch (error) {
      console.error('Error deleting country:', error);
      throw error;
    }
  }


  setDsrRequestRid(data: any) {
    setItem(LSK_COUNTRY_CURRENT_RID, data);
  }

  getPrevRequestShifted() {
    const val = localStorage.getItem(LSK_COUNTRY_PREV_SHIFTED);
    return val == 'true' ? true : false
  }

  getDsrRequestRid() {
    let result: any = localStorage.getItem(LSK_COUNTRY_CURRENT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }

  removePrevRequestRid() {
    removeItem(LSK_COUNTRY_PREV_RID);
  }


  getPrevRequestRid() {
    let result: any = localStorage.getItem(LSK_COUNTRY_PREV_RID)
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
    let result: any = localStorage.getItem(LSK_COUNTRY_NEXT_RID)
    try {
      let list = JSON.parse(result)
      return list ? list : []
    } catch (e) {
      return []
    }
  }
  getNextRequestShifted() {
    const val = localStorage.getItem(LSK_COUNTRY_NEXT_SHIFTED);
    return val == 'true' ? true : false
  }
  getNextRequestPageNo(isDecrement: boolean = false) {
    const filters = getItem(LSK_COUNTRY_FILTER);
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
    const filters = getItem(LSK_COUNTRY_FILTER);
    setItem(LSK_COUNTRY_FILTER, {
      ...filters,
      page: pageNo,
    });
  }


  setPrevRequestPage(prevPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_COUNTRY_FILTER) || {};

    if (isSetToPageNo) {
      const pageToSet = prevPageNo > 0 ? prevPageNo : (filters.prevPageNo || 1);

      setItem(LSK_COUNTRY_FILTER, {
        ...filters,
        page: pageToSet,
        total:
          pageToSet === 1 && filters.tempTotal > 0
            ? filters.tempTotal
            : filters.total,
      });
      return;
    }

    setItem(LSK_COUNTRY_FILTER, {
      ...filters,
      prevPageNo,
    });
  }

  setPrevRequestShifted(value: string) {
    localStorage.setItem(LSK_COUNTRY_PREV_SHIFTED, value);
  }

  setPrevRequestRid(data: any) {
    setItem(LSK_COUNTRY_PREV_RID, data);
  }
  removeNextRequestRid() {
    removeItem(LSK_COUNTRY_NEXT_RID);
  }

  setNextRequestPage(nextPageNo: number, isSetToPageNo: boolean = false) {
    const filters = getItem(LSK_COUNTRY_FILTER);
    if (isSetToPageNo) {
      setItem(LSK_COUNTRY_FILTER, {
        ...filters,
        page: filters.nextPageNo,
      });
      return
    }
    setItem(LSK_COUNTRY_FILTER, {
      ...filters,
      nextPageNo: nextPageNo,
    });
  }

  setNextRequestShifted(value: string) {
    localStorage.setItem(LSK_COUNTRY_NEXT_SHIFTED, value);
  }
  setNextRequestRid(data: any) {
    setItem(LSK_COUNTRY_NEXT_RID, data);
  }





  clearCountryNavigationState() {
    removeItem(LSK_COUNTRY_PREV_RID);
    removeItem(LSK_COUNTRY_NEXT_RID);
    removeItem(LSK_COUNTRY_PREV_SHIFTED);
    removeItem(LSK_COUNTRY_NEXT_SHIFTED);
    removeItem(LSK_COUNTRY_FILTER);
  }

}

