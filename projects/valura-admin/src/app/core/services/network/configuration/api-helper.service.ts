import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, throwError } from 'rxjs';
import { ADD_TRIGGER, ADD_VALIDATION_QUESTION, ASSESSMENT_TYPE, COUNTRIES_LIST, COUNTRY_BY_ID, CREATE_PARAMETER, EDIT_DELETE_TRIGGER, EDIT_DELETE_VALIDATION_QUESTION, GET_PARAMETER } from '@admin-core/constants/api-constants';
import { CONFIGURATION_SUB_DOMAIN, EMAIL_TEMPLATE_DRAFT_KEY } from '@admin-core/constants/constants';
import { HttpService } from '@valura-lib/service/network/http.service';
import { EmailTemplatePayload } from '@admin-page/configuration/email-configuration/email-configuration.model';
import { CreateParameterRequest, GetParametersResponse } from '@admin-page/data-discovery/bpa-listing/create-bpa/risk-summary-screen/models/risk-summary-model';

@Injectable({
  providedIn: 'root'
})

export class ApiHelperService {

  private httpService = inject(HttpService);

  constructor() { }

  async getConfigurations(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/configs`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  saveConfiguration(id: number, body: any) {
    return this.httpService
      .httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/configs/${id}`,
        body,
        showSnackBar: true
      })
      .pipe(
        map(res => {
          if (!res.isSuccess) {
            throw new Error(res.message);
          }
          return res.data;
        })
      );
  }

  async getRegulationList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/acts`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      })
  }

  async getDataSubject(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/data-subjects`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      })
  }

  async getActsTriggerList(actId: number = 0, params: any = null) {
    const quyeryUrl = actId ? `${CONFIGURATION_SUB_DOMAIN}/acts/${actId}/triggers` : `${CONFIGURATION_SUB_DOMAIN}/triggers`;
    return await firstValueFrom(
      this.httpService.httpGet(`${quyeryUrl}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      })
  }

  async getTriggerById(params: { regulationId: number; page: number; size: number, assessmentTypes: number[] }) {
    const { regulationId, page, size, assessmentTypes } = params;
    const queryParams: any = {};
    if (page !== 0 && size !== 0) {
      queryParams.params = { page, size };
    }

    if (assessmentTypes?.length > 0) {
      queryParams.assessmentTypes = assessmentTypes
    }

    return await firstValueFrom(this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/acts/${regulationId}/triggers`, queryParams)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async onDeleteClick(element: any) {
    return await firstValueFrom(
      this.httpService.httpDelete(EDIT_DELETE_TRIGGER(element.id), null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async approversOperation(params: any, assessmentId: number, showSnackBar: boolean = true) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpPost({
          queryUrl: `assessment/${assessmentId}`,
          body: params,
          showSnackBar: showSnackBar,
        })
      );
      return res.data || res;
    } catch (e) {
      console.error('Error', e);
      throw e;
    }
  }

  async editTrigger(element: any, body: any) {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: EDIT_DELETE_TRIGGER(element.id),
        body: body,
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  async getLegalBasisById(params: { regulationId: number; page: number; size: number }) {
    const { regulationId, page, size } = params;
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/acts/${regulationId}/legal-basis`, {
        params: { page, size },
      })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getRegulationById(id: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/acts/${id}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getLegalBasisDetailsById(legalBasisId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/legal-basis/${legalBasisId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching legal basis details:', e);
        throw e;
      });
  }

  async createLegalBasis(actId: number, params: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpPost({
          queryUrl: `${CONFIGURATION_SUB_DOMAIN}/acts/${actId}/legal-basis`,
          body: params,
          showSnackBar: true,
        })
      );
      return res.data || res;
    } catch (e) {
      console.error('Error', e);
      throw e;
    }
  }

  async updateLegalBasis(legalBasisId: number, params: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpPut({
          queryUrl: `${CONFIGURATION_SUB_DOMAIN}/legal-basis/${legalBasisId}`,
          body: params,
          showSnackBar: true,
        })
      );
      return res.data || res;
    } catch (e) {
      console.error('Error', e);
      throw e;
    }
  }

  async deleteLegalBasis(legalBasisId: number) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/legal-basis/${legalBasisId}`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async createTrigger(actId: number, params: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpPost({
          queryUrl: `${CONFIGURATION_SUB_DOMAIN}/triggers/${actId}`,
          body: params,
          showSnackBar: true,
        })
      );
      return res.data || res;
    } catch (e) {
      console.error('Error', e);
      throw e;
    }
  }

  async updateTrigger(triggerId: number, params: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpPut({
          queryUrl: `${CONFIGURATION_SUB_DOMAIN}/triggers/${triggerId}`,
          body: params,
          showSnackBar: true,
        })
      );
      return res.data || res;
    } catch (e) {
      console.error('Error', e);
      throw e;
    }
  }

  async deleteTrigger(triggerId: number) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/triggers/${triggerId}`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async deleteAct(actId: number) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/acts/${actId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async createRight(params: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpPost({
          queryUrl: `${CONFIGURATION_SUB_DOMAIN}/rights`,
          body: params,
          showSnackBar: true
        })
      );
      return res?.data || res;
    } catch (e) {
      console.error('Error', e);
      throw e;
    }
  }

  async updateRight(rightsId: number, params: any) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpPut({
          queryUrl: `${CONFIGURATION_SUB_DOMAIN}/rights/${rightsId}`,
          body: params,
          showSnackBar: true
        })
      );
      return res?.data || res;
    } catch (e) {
      console.error('Error', e);
      throw e;
    }
  }


  async deleteRight(rightsId: number) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/rights/${rightsId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async createRegulation(regulationData: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/acts`,
        body: regulationData,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => res.data || res)
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async updateRegulation(regulationData: any, id: number) {
    return await firstValueFrom(
      this.httpService.httpPatch({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/acts/${id}`,
        body: regulationData,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => res.data || res)
      .catch(e => { console.error('Error', e); throw e; });
  }

  async getRightsMasterList(regulationId: number = 0, params: any = null) {
    const qyeryUrl = regulationId ? `${CONFIGURATION_SUB_DOMAIN}/rights/${regulationId}` : `${CONFIGURATION_SUB_DOMAIN}/rights`;
    return await firstValueFrom(
      this.httpService.httpGet(`${qyeryUrl}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  async deleteSecurityControl(securityControlId: string) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/security-control/${securityControlId}`))
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getCountryConfiguration(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-subject-form/configuration/country`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getCountriesList() {
    const url = COUNTRIES_LIST;
    return await firstValueFrom(
      this.httpService.httpGet(url)
    )
      .then(res => {
        if (res.data && res.data.countries) {
          return res.data.countries;
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error fetching countries:', e);
        throw new Error(e)
      });
  }

  async getLegalBasisMasterList() {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/legal-basis`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  async getLegalBasesByActId(actId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/acts/${actId}/legal-basis`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getSecurityControls(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/security-control`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  async addSecurityControls(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/security-control`,
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

  createCountry(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `${COUNTRIES_LIST}`,
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

  async updateCountry(countryId: number, data: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: COUNTRY_BY_ID(countryId),
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update country');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async deleteCountry(countryId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(COUNTRY_BY_ID(countryId))
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getCountryById(countryId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(COUNTRY_BY_ID(countryId))
    )
      .then(res => {
        if (res.data && res.data.country) {
          return res.data.country;
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDsrConfiguration() {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/configuration`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  async getParameters(): Promise<GetParametersResponse> {
    return await firstValueFrom(
      this.httpService.httpGet(GET_PARAMETER)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error fetching parameters:', e);
        throw e;
      });
  }

  createParameter(parameterData: CreateParameterRequest) {
    return this.httpService
      .httpPost({
        queryUrl: CREATE_PARAMETER,
        body: parameterData,
        showSnackBar: true,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to create parameter');
          }
          return res;
        }),
        catchError(error => {
          console.error('Parameter creation failed:', error);
          let errorMessage = 'Failed to create parameter';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  async getCategoryDetails(categoryId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/pd-category/${categoryId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching category details:', e);
        return null;
      });
  }

  async getDataSubjectList() {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/data-subjects`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  async getDataSubjectById(id: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/data-subjects/${id}`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  createDataSubject(data: { name: string; description: string }): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/data-subjects`,
        body: data,
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }


  async updateDataSubject(dataSubjectId: number, data: { name: string; description: string }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/data-subjects/${dataSubjectId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update data subject');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async deleteDataSubject(dataSubjectId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/data-subjects/${dataSubjectId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getThirdPartyList(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/third-party-role`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        throw new Error(e)
      });
  }

  async getPlatformList(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/platform`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        throw new Error(e)
      });
  }

  async getValidationQuestionsList(params: any = null): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/validation-question`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        throw new Error(e)
      });
  }

  async getDeclarationList(params: any = null): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/declaration`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        throw new Error(e)
      });
  }

  async getDeclarationsByEntity(params: {
    specificType: 'REGULATION_SPECIFIC' | 'RIGHT_SPECIFIC';
    entityType: 'REGULATION' | 'RIGHT';
    entityId: number;
    actId: number;
  }): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/declaration`, params)
      );
      return res.data;
    } catch (e) {
      console.error('Error fetching declarations:', e);
      return null;
    }
  }


  async addDeclaration(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/declaration`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async updateDeclaration(id: number, data: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/declaration/${id}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async deleteDeclaration(declarationId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/declaration/${declarationId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting declaration:', e);
        throw e;
      });
  }

  async getDeclarationById(declarationId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/declaration/${declarationId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching declaration details:', e);
        throw e;
      });
  }

  async getPDElements(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/pd-elements`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching PD elements:', e);
        throw new Error(e)
      });
  }

  createPDElement(data: { name: string; categoryId: number }): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-elements`,
        body: data,
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }


  async deletePDElement(pdElementId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/pd-elements/${pdElementId}`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting PD element:', e);
        return null;
      });
  }

  async updatePDElement(pdElementId: number, data: { name: string; categoryId: number }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-elements/${pdElementId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update PD element');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating PD element:', e);
        throw e;
      });
  }

  async getPdCategories(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/pd-category`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        throw new Error(e)
      });
  }

  createPdCategory(payload: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-category`,
          body: payload,
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

  async deletePdCategory(pdCategoryId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/pd-category/${pdCategoryId}`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async updatePDCategory(pdCategoryId: number, data: { name: string; sensitivity: string }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-category/${pdCategoryId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update category');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async getAssessmentTypes(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/assessment-type`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  addNewAssessmentType(data: any) {
    return this.httpService
      .httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/assessment-type`,
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

  async getClassifications(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`configuration/classification`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        throw new Error(e)
      });
  }

  async addQuestion(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: ADD_VALIDATION_QUESTION,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async updateQuestion(id: number, data: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${EDIT_DELETE_VALIDATION_QUESTION(id)}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }


  async addTriggers(data: any, regulationId: any, assessmentType: any) {
    const body = {
      name: data.name,
      source: data.source,
      triggerLabel: data.triggerLabel,
      assessmentType: assessmentType
    }

    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: ADD_TRIGGER(regulationId),
        body: body,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async onAddAssessmentType(assessmentName: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: ASSESSMENT_TYPE,
        body: { name: assessmentName },
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async createGeneralDataSubject(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/data-subjects`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => res.data || res)
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async getAllPdElements(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/pd-elements`, params)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async onAddPdElements(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-elements`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async updatePdElements(pdElementId: number, data: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-elements/${pdElementId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async getAllPdCategory() {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/pd-category`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getAllClassification() {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/classification`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async onDeletePdElements(PdElementId: any) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/pd-elements/${PdElementId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async onDeleteAssessment(AssessmentId: any) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/assessment-type/${AssessmentId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async editAssessment(id: any, body: any) {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/assessment-type/${id}`,
        body: body,
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async onDeletePdCategory(pdCategoryId: any) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/pd-category/${pdCategoryId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async onDeletePdClassification(classificationId: any) {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/classification/${classificationId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async onAddCategory(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-category`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async updatePdCategory(pdCategoryId: number, data: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/pd-category/${pdCategoryId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async updatePdClassification(classificationId: number, data: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/classification/${classificationId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }

  async onAddClassification(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/classification`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error', e);
        throw e;
      });
  }

  async getEmailConfiguration(params: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/email-configuration`, params))
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching email configuration:', e);
        return null;
      });
  }

  async checkDuplicateEmailTemplate(params: any): Promise<any> {
    const parameeters = {
      triggerEvent: params
    }
    return await firstValueFrom(
      this.httpService.httpGet(`notification-service/templates/duplicate-name-check`, parameeters))
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching email configuration:', e);
        return null;
      });
  }

  async getTriggerPoints(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`notification-service/templates/trigger-points`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching email configuration:', e);
        return null;
      });
  }

  async saveEmailTemplate(payload: EmailTemplatePayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `notification-service/templates`,
        body: payload,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error saving email template', e);
        throw e;
      });
  }

  async getEmailTemplate(
    params: any,
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ): Promise<any> {

    const queryParams = {
      ...params,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
      searchQuery: filters.searchText
    };
    return await firstValueFrom(
      this.httpService.httpGet(`notification-service/templates`, queryParams)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching email configuration:', e);
        return [];
      });
  }

  async updateEmailTemplate(templateId: number, payload: EmailTemplatePayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `notification-service/templates/${templateId}`,
        body: payload,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error updating email template', e);
        throw e;
      });
  }

  async getEmailTemplateById(templateId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`notification-service/templates/${templateId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching email template:', e);
        return null;
      });
  }

  async deleteEmailTemplate(templateId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(
        `notification-service/templates/${templateId}`,
        null,
        null,
        true,
        true
      )
    )
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error deleting email template', e);
        throw e;
      });
  }

  saveManualDraft(data: any, requestId: string) {
    return requestId ?
      this.httpService.httpPut({
        queryUrl: `drafts/manual/${requestId}`,
        body: data,
        showSnackBar: true,
      })
      :
      this.httpService.httpPost({
        queryUrl: `drafts/manual`,
        body: data,
        showSnackBar: true,
      })
        .pipe(map(res => {
          if (!res.isSuccess) {
            throw new Error(res.message)
          }
          return res.data
        }))
  }


  async saveManualDraftPost(data: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `drafts/manual`,
        body: data,
        showSnackBar: true,
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error saving draft', e);
        throw e;
      });
  }


  async saveManualDraftPut(data: any, requestId: string): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `drafts/manual/${requestId}`,
        body: data,
        showSnackBar: true,
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating draft', e);
        throw e;
      });
  }

  async getManualDraftDetails(draftId: string, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`drafts/manual/${draftId}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getManualDrafts(
    params: {
      page?: number;
      size?: number;
    } = {},
    filters: {
      sortBy?: string;
      sortDirection?: string;
      searchText?: string;
    } = {}
  ): Promise<any[]> {

    const queryParams = {
      key: EMAIL_TEMPLATE_DRAFT_KEY,
      page: params.page ?? 1,
      size: params.size ?? 10,
      sortBy: filters.sortBy ?? '',
      sortDirection: filters.sortDirection ?? '',
      searchQuery: filters.searchText ?? ''
    };

    try {
      const res = await firstValueFrom(
        this.httpService.httpGet('drafts/manual/search', queryParams)
      );

      if (res?.data?.content) {
        return res.data.content.map((draft: any) => ({
          id: draft.id,
          name: draft.formData?.name || '',
          triggerEvent: draft.formData?.triggerEvent || '',
          triggerDescription: draft.formData?.triggerDescription || '',
          subject: draft.formData?.emailSubject || '',
          htmlContent: draft.formData?.htmlContent || '',
          status: 'draft',
          saveType: draft.saveType,
          notificationType: draft.formData?.notificationType || ''
        }));
      }
      return [];
    } catch (e) {
      console.error('Error fetching manual drafts:', e);
      return [];
    };
  }

  async deleteManualDraft(draftId: string): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`drafts/manual/${draftId}`, null, null, false, false))
      .then(res => {
        return res;
      })
      .catch(e => {
        console.error('Error deleting draft', e);
        throw e;
      });
  }

  async getDisplayTextPages(params: any = null): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/dsr/page`, params)
    )
      .then(res => {
        return res.data;
      })
      .catch(e => {
        console.error('Error fetching display text pages:', e);
        return null;
      });
  }

  async createDisplayTextPage(data: {
    title: string;
    description: string;
    order: number
  }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/dsr/page`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res.data;
      })
      .catch(error => {
        console.error('Error Creating Display Text Page', error)
        throw error;
      });
  }

  async UpdateDisplayTextPage(id: number, data: {
    title: string;
    description: string;
    order: number;
  }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/dsr/page/${id}`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      }))
      .then(
        res => {
          return res.data
        })
      .catch(error => {
        console.error('Error Updating Displat Text', error);
        throw error;
      })
  }

  async deleteDisplayTextPage(id: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${CONFIGURATION_SUB_DOMAIN}/dsr/page/${id}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting display text page:', e);
        throw e;
      });
  }

  async updateDisplayTextPageOrder(data: {
    dsrConfigurationPageOrderList: Array<{
      id: number;
      order: number;
    }>;
  }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${CONFIGURATION_SUB_DOMAIN}/dsr/page`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      })
    )
      .then(res => {
        return res.data;
      })
      .catch(error => {
        console.error('Error updating page order:', error);
        throw error;
      });
  }
  publishChanges(data: any) {
    return this.httpService
      .httpPost({
        queryUrl: `configuration/publish-dsr`,
        body: data,
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async getIcons(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${CONFIGURATION_SUB_DOMAIN}/icons`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching icons:', e);
        return null;
      });
  }
}

