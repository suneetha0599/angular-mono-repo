import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { QuickCreateAssetRequest } from '../../../models/DataDiscovery/Asset';
import { AUTH_DEPARTMENT_API } from '@admin-core/constants/api-constants';
import { HttpService } from '@valura-lib/service/network/http.service';

@Injectable({
  providedIn: 'root'
})


export class ApiHelperService {

  private httpService = inject(HttpService);

  constructor() { }

  async getBpaSource(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/source`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getChannels(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`configuration/channels`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getSourceMasterList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/source-master-list`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getBpaAsset(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/assets`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getVendorRelatedComponents(vendorId: number = 0) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/vendor/${vendorId}/related-components`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getRecipientMasterList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/recipient-master-list`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getDepartmentsList(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_DEPARTMENT_API}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }


  async getVendorList(params: any = null): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/vendor`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getThirdParty(): Promise<any> {
    try {
      const res: any = await firstValueFrom(
        this.httpService.httpGet(`data-inventory/third-parties`)
      );
      return res?.data || [];
    } catch (e) {
      console.error('Error fetching categories:', e);
      return [];
    }
  }

  addNewPdElements(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `data-inventory/pd-elements`,
          body: data,
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async createBpaSource(payload: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `data-inventory/source`,
        body: payload,
        showSnackBar: true
      })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error creating source:', e);
        throw e;
      });
  }

  async createBpaAsset(payload: QuickCreateAssetRequest) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `data-inventory/assets`,
        body: payload,
        showSnackBar: true
      })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error creating asset:', e);
        throw e;
      });
  }

  async getCategorises(): Promise<any> {
    try {
      const res: any = await firstValueFrom(
        this.httpService.httpGet(`data-inventory/assets/categories`)
      );
      return res?.data || [];
    } catch (e) {
      console.error('Error fetching categories:', e);
      return [];
    }
  }

  async addCategory(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `data-inventory/assets/categories`,
        body: data,
        showSnackBar: true
      }).pipe(
        map(res => {
          if (!res.isSuccess) throw new Error(res.message);
          return res.data;
        })
      )
    );
  }



  async getVendors(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/vendor`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  bpaSaveManualDraftNew(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `drafts/manual`,
          body: data,
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  bpaSaveManualDraft(data: any, bpaRequestId: string) {
    return this.httpService
      .httpPut(
        {
          queryUrl: `drafts/manual/${bpaRequestId}`,
          body: data,
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async getBpaDraftRequestDetails(draftId: string, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`drafts/manual/${draftId}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  onSaveBpa(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `bpa`,
          body: data,
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  onUpdateBpa(data: any, bpaId: number) {
    return this.httpService
      .httpPut(
        {
          queryUrl: `bpa/${bpaId}`,
          body: data,
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  saveBpaDrafts(data: any) {
    return this.httpService
      .httpPut(
        {
          queryUrl: `drafts`,
          body: data,
          showSnackBar: false,
          showSnackBarOnError: false,
          showLoadingBar: false
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async getDraftCount(key: string, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`drafts/${key}/count`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getBpaDraftDetails(key: string, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`drafts/${key}/form-data`, params, false, false)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }


  async deleteManualDraftRequest(draftId: string, showSnackBar = false): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`drafts/manual/${draftId}`, null, null, showSnackBar))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getBpaRequestDetails(bpaId: number, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`bpa/${bpaId}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async pdInventoryMasterList() {
    return await firstValueFrom(
      this.httpService.httpGet(`configuration/pd-inventory`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async deleteDraftRequest(draftkey: string): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`drafts/${draftkey}`, null, null, false, false))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async deleteDepartment(departmentId: string): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${AUTH_DEPARTMENT_API}/${departmentId}`))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async deleteCategory(categoryId: string): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`data-inventory/assets/categories/${categoryId}`))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async deleteVendor(vendorId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`data-inventory/vendor/${vendorId}`))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }


}
