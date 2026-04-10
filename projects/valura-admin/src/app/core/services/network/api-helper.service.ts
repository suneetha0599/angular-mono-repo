import { inject, Injectable, Injector } from '@angular/core';
import { catchError, firstValueFrom, map, Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { AUTH_RESET_PASSWORD, ASSIGN_DEPARTMENT, ASSIGN_ROLE, PRIMITIVES, UNASSIGN_DEPARTMENT, UNASSIGN_ROLE, EXTERNAL_AUTH_VALIDATE, EXTERNAL_AUTH_LOGIN, INTERNAL_AUTH_LOGIN, INTERNAL_AUTH_VALIDATE, RISK_LIST, CREATE_RISK, AUTH_REFRESH_TOKEN, IDP_LIST, AUTH_PASSWORD, AUTH_LOGIN, AUTH_FORGOT_PASSWORD, AUTH_ROLE_API, AUTH_DEPARTMENT_API, AUTH_USER_API, NOTIFICATION_LIST, NOTIFICATION_UNREAD_COUNT, NOTIFICATION_MARK_READ, NOTIFICATION_MARK_ALL_READ, GET_OR_CREATE_INTERNAL_USER, GET_OR_CREATE_EXTERNAL_USER, UserPurpose, CREATE_ASSESSMENT } from '../../constants/api-constants';
import { User } from '../../models/user-management/users.model';
import { CreateUserPayload } from '../../models/user-management/users.model';
import { DSR_ATTACHMENT } from '../../constants/constants';
import { TASK_DETAILS } from '@admin-page/task-management/constant';
import { UpdateTaskRequest } from '@admin-page/request-management/request-management-dialog/create-task-dialog/models/task-dto.model';
import { CreateRiskRequest, CreateRiskResponse, GetRisksResponse } from '@admin-page/data-discovery/bpa-listing/create-bpa/risk-summary-screen/models/risk-summary-model';
import { UpdateUserPermissionsPayload } from '@admin-core/models/role-management/role.model';
import { HttpService } from '@valura-lib/service/network/http.service';

interface BulkImportDsPayload {
  dataSubjects: string[];
}

interface BulkImportPdPayload {
  pdElementList: {
    name: string;
    pdCategoryName: string[];
    classification: string[];
  }[];
}

interface BulkImportPurposePayload {
  purposes: string[];
}

interface BulkImportAssetPayload {
  assets: {
    name: string;
    assetType: 'INTERNAL' | 'EXTERNAL';
  }[];
}

@Injectable({
  providedIn: 'root'
})


export class ApiHelperService {

  private httpService = inject(HttpService);
  private injector = inject(Injector);



  constructor() { }

  authorizeUser(body: any, queryUrl: string) {
    return this.httpService
      .httpRequestWithHeader(
        {
          queryUrl: queryUrl,
          body: body
        })
      .pipe(
        map(res => {
          return res
        })
      )
  }



  async getDsrRequestsList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getEntitySwitchData(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`organization/switch`, params, false, true, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getLogin(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(AUTH_LOGIN, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDownloadResponse(params: any = null, body: any = null) {
    return await firstValueFrom(
      this.httpService.httpPost({ queryUrl: `dsr/export`, params, body })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getBpaActivityList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`bpa`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDraftManualRequests(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`drafts/manual/search`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDownloadList(endpoint: string = 'dataprocessor/logs') {
    return await firstValueFrom(
      this.httpService.httpGet(endpoint)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching download list', e);
        return null;
      });
  }

  async getAssetList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/assets`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getAllAssetDetails() {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/assets`, null)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getAssesmentList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDocumentList(dsrFormId: number, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/${dsrFormId}/documents`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  pauseDsrRequest(dsrFormId: number, reason: string): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: `dsr/${dsrFormId}/pause-dsrRequest?reason=${encodeURIComponent(reason)}`,
        body: {},
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  resumeDsrRequest(dsrFormId: number): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: `dsr/${dsrFormId}/resume-dsrRequest`,
        body: {},
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async getTaskList(params: any = null) {


    return await firstValueFrom(
      this.httpService.httpGet(`tm/task`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching task list:', e);
        return null;
      });
  }

  async getTaskDetails(taskId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(TASK_DETAILS(taskId), null)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getAssessmentTaskDetails(taskId: number, assessmentId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/task/${taskId}/detail`, null)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }
  async getQuestionDetails(questionId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/question/${questionId}`, null, false, false))
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching question details:', e);
        return null;
      });
  }

  // async getMeasureDetails(measureId: number): Promise<any> {
  //   return await firstValueFrom(
  //     this.httpService.httpGet(`assessment/measure/${measureId}`)
  //   )
  //     .then(res => res.data)
  //     .catch(e => {
  //       console.error('Error fetching measure details:', e);
  //       return null;
  //     });
  // }

  async getMeasureDetails(measureId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/measure/${measureId}`,
        body: {},
        showSnackBar: false,
        showSnackBarOnError: false
      })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching measure details:', e);
        return null;
      });
  }
  async getAssetDetails(assetRid: number, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/assets/${assetRid}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }



  async getClarificationList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`task-management/clarifications`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDsrRequestDetails(requestRid: number, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/${requestRid}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  createDsrTask(dsrFormId: number, data: any) {
    const taskData = {
      ...data,
      stage: data.stage
    };

    if (!taskData.stage) {
      console.error('Stage parameter is required for DSR task creation');
      throw new Error('Stage parameter is required for task creation');
    }

    return this.httpService
      .httpPost({
        queryUrl: `dsr/${dsrFormId}/task`,
        body: taskData,
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  createDataSubjectTask(dsrFormId: number, data: any) {
    const taskData = {
      ...data,
      dsrStage: data.dsrStage
    };

    if (!taskData.dsrStage) {
      console.error('dsrStage parameter is required for data subject task creation');
      throw new Error('dsrStage parameter is required for data subject task creation');
    }

    return this.httpService
      .httpPost({
        queryUrl: `dsr/${dsrFormId}/task/to-ds`,
        body: taskData,
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }
  getOrCreateExternalUser(requestBody: { email: string; purpose: UserPurpose }): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: GET_OR_CREATE_EXTERNAL_USER,
        body: requestBody,
        showSnackBar: false,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to process external user');
          }
          return res;
        }),
        catchError(error => {
          console.error('External user lookup/creation failed:', error);
          let errorMessage = 'Failed to process external user';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  getOrCreateInternalUser(requestBody: { email: string; purpose: UserPurpose }): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: GET_OR_CREATE_INTERNAL_USER,
        body: requestBody,
        showSnackBar: false,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to process internal user');
          }
          return res;
        }),
        catchError(error => {
          console.error('Internal user lookup/creation failed:', error);
          let errorMessage = 'Failed to process internal user';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  async getRequestTaskList(formRid: number, params: any) {
    try {
      const response = await firstValueFrom(this.httpService.httpGet(`dsr/${formRid}/task`, params));

      if (!response.success) {
        console.error('API returned error:', response.message);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching task list:', error);
      return null;
    }
  }

  async fetchRequestDetails(firstPartyEmail: string, params: any) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/form-user/${firstPartyEmail}/dsr-request`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  saveDsrRequestDetails(data: any, formRid: number, eventName: string) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${formRid}/admin-events/${eventName}`,
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


  reSyncData(formRid: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${formRid}/resync`,
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

  async getRolesList(showSnackBar: boolean = false): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(AUTH_ROLE_API, null, showSnackBar)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching roles:', e);
        return null;
      });
  }

  async deleteRole(roleId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${AUTH_ROLE_API}/${roleId}`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting role:', e);
        return null;
      });
  }

  async deleteIdp(id: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`idp/${id}`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting role:', e);
        return null;
      });
  }

  async createRole(data: { name: string, description: string, primitives: string[] }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: AUTH_ROLE_API,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to create role');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error creating role:', e);
        throw e;
      });
  }

  async updateRole(roleId: number, data: { name: string, description: string, primitives: string[] }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${AUTH_ROLE_API}/${roleId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update role');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating role:', e);
        throw e;
      });
  }

  async getAuthDepartmentsList(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_DEPARTMENT_API}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async createDepartment(data: { name: string, description: string }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${AUTH_DEPARTMENT_API}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to create department');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error creating department:', e);
        throw e;
      });
  }

  async updateDepartment(departmentId: number, data: { name: string, description: string }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${AUTH_DEPARTMENT_API}/${departmentId}`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update department');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating department:', e);
        throw e;
      });
  }


  async updatePassword(data: { password: string }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${AUTH_PASSWORD}`,
        body: data,
        showSnackBar: false,
        defaultServerUrl: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating department:', e);
        throw e;
      });
  }
  async deleteDepartment(departmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${AUTH_DEPARTMENT_API}/${departmentId}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting department:', e);
        return null;
      });
  }

  async getDepartmentById(departmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_DEPARTMENT_API}/${departmentId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching department details:', e);
        return null;
      });
  }

  async assignUsersToDepartment(departmentId: number, userIds: number[]): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${AUTH_DEPARTMENT_API}/${departmentId}/users`,
        body: { applicationUserIds: userIds },
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to assign users to department');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error assigning users to department:', e);
        throw e;
      });
  }

  async unassignUsersFromDepartment(departmentId: number, userIds: number[]): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${AUTH_DEPARTMENT_API}/${departmentId}/users`, null, { applicationUserIds: userIds })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to unassign users from department');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error unassigning users from department:', e);
        throw e;
      });
  }

  async getRoleById(roleId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_ROLE_API}/${roleId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching user details:', e);
        return null;
      });
  }

  async getPrimitives(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(PRIMITIVES)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching primitives:', e);
        return null;
      });
  }

  async createUser(userData: CreateUserPayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: AUTH_USER_API,
        body: userData,
        showSnackBar: true
      })
    )
      .then(res => res.data || res)
      .catch(e => {
        console.error('API Error:', e);
        throw e;
      });
  }

  async inviteUser(userId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${AUTH_USER_API}/${userId}/resend-invite`,
      })
    )
      .then(res => res.data || res)
      .catch(e => {
        console.error('API Error', e);
        throw e;
      })
  }

  async updateUserPermissions(userId: number, data: UpdateUserPermissionsPayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${AUTH_USER_API}/${userId}/overrides`,
        body: data,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating user permissions:', e);
        throw e;
      });
  }

  async getUserById(userId: number): Promise<User | null> {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_USER_API}/${userId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching user details:', e);
        return null;
      });
  }

  async updateUser(userId: number, payload: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `${AUTH_USER_API}/${userId}`,
        body: payload,
        showSnackBar: true
      })
    ).then(res => res)
      .catch(e => {
        console.error('Error updating user:', e);
        throw e;
      });
  }

  async deleteUser(userId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`${AUTH_USER_API}/${userId}`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting user:', e);
        throw e;
      });
  }

  async getDepartmentsList(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_DEPARTMENT_API}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        throw new Error(e)
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


  async addVendor(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `data-inventory/vendor`,
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

  async addThirdParty(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `data-inventory/third-parties`,
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

  async assignRoleToUsers(data: { roleId?: number, roleIds?: number[], applicationUserIds: number[] }): Promise<any> {

    let requestBody;

    if (data.roleIds && data.roleIds.length > 0) {

      requestBody = {
        roleIds: data.roleIds,
        applicationUserIds: data.applicationUserIds
      };
    } else if (data.roleId) {

      requestBody = {
        roleIds: [data.roleId],
        applicationUserIds: data.applicationUserIds
      };
    } else {
      throw new Error('Either roleId or roleIds must be provided');
    }

    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: ASSIGN_ROLE,
        body: requestBody,
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error assigning roles:', e);
        throw e;
      });
  }

  async unassignRoleFromUsers(data: { roleIds: number[], applicationUserIds: number[] }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(UNASSIGN_ROLE, null, {
        roleIds: data.roleIds,
        applicationUserIds: data.applicationUserIds
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error unassigning roles:', e);
        throw e;
      });
  }

  async assignDepartmentToUsers(departmentId: number, userIds: number[]): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: ASSIGN_DEPARTMENT(departmentId),
        body: { applicationUserIds: userIds },
        showSnackBar: true
      })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error assigning department:', e);
        throw e;
      });
  }

  async unassignDepartmentFromUsers(departmentId: number, userIds: number[]): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(
        UNASSIGN_DEPARTMENT(departmentId),
        null,
        { applicationUserIds: userIds }
      )
    )
      .then(res => res)
      .catch(e => {
        console.error('Error unassigning department:', e);
        throw e;
      });
  }

  saveRequestNotes(data: any, formRid: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${formRid}/notes`,
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

  async resetPassword(email: string): Promise<any> {
    try {
      const params = { email };
      const res = await firstValueFrom(
        this.httpService.httpGet(AUTH_RESET_PASSWORD, params)
      );
      return res;
    } catch (e) {
      console.error('Reset password error:', e);
      throw e;
    }
  }


  async getForgotPassword(email: string): Promise<any> {
    try {
      const params = { email };
      const res = await firstValueFrom(
        this.httpService.httpGet(`${AUTH_FORGOT_PASSWORD}`, params)
      );
      return res;
    } catch (e) {
      console.error('Reset password error:', e);
      throw e;
    }
  }

  downloadFile(body: any, params: any = null) {
    return this.httpService.httpGetFile({
      queryUrl: `download`,
      body: body,
      params: params
    })
      .pipe(map(res => {
        if (res) {
          const element = document.createElement('a');
          element.href = window.URL.createObjectURL(new Blob([res.body],
            { type: res.headers.get('Content-Type') }));
          element.setAttribute('download', res.headers.get('Content-Disposition').split('"')[1]);
          document.body.appendChild(element);
          element.click();
        }
      }))
  }

  onEscalateRequest(data: any, formRid: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${formRid}/escalation`,
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

  preLogin(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `pre-login`,
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

  onExtendDsrRequest(data: any, formRid: number) {
    return this.httpService
      .httpPatch({
        queryUrl: `dsr/${formRid}/extend`,
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

  onChangePriority(data: any, dsrFormId: number, payLoad: any = null) {
    return this.httpService
      .httpPatch({
        queryUrl: `dsr/${dsrFormId}/priority?priority=${data.priority}`,
        body: payLoad,
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }


  saveRequestTask(data: any, formRid: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${formRid}/task`,
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

  saveUploadForm(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: 'data-subject-form/complete-upload-file',
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

  async uploadPresignedUrl(params: any = null) {
    const result = await firstValueFrom(
      this.httpService.httpGet(`file-service/upload-presigned-url`, params))
      .then(res =>
        this.httpService.isSuccess(res.success) ? res.data : null)
      .catch(e => null)

    return result
  }

  async getPresignedUrl(params: any = null) {
    const result = await firstValueFrom(
      this.httpService.httpGet(`file-service/preview-presigned-url`, params))
      .then(res =>
        this.httpService.isSuccess(res.success) ? res.data : null)
      .catch(e => null)

    return result
  }

  async getImageEtag(imageUrl: string, file: File, params: any = null) {
    const showSnackBar = false;
    const showSnackBarOnError = false

    const result = await firstValueFrom(
      this.httpService.httpPutRequestWithHeader({ queryUrl: `${imageUrl}`, file, params, showSnackBar, showSnackBarOnError }))
      .then(res => res)
      .catch(e => null)

    return result
  }

  async getFormUserID(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/form-user`,
          body: data,
          showSnackBar: false,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async createRequest(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr`,
          body: data,
          showSnackBar: true,
          showSnackBarOnError: true
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  saveDataFullFillmentRecords(data: any, formRid: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${formRid}/task`,
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

  async getDataFufillmentRecords(formRid: number, taskRid: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/${formRid}/task/${taskRid}/record`, null)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching global config:', e);
        return null;
      });
  }

  async getUserMasterList(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_USER_API}`, params))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        throw new Error(e)
      });
  }

  async getUserMasterListWithUserType(userTypes?: string) {
    const params: any = {};
    if (userTypes) {
      if (userTypes.includes(',')) {
        const typesArray = userTypes.split(',');
        params.userType = typesArray;
      } else {
        params.userType = userTypes;
      }
    }

    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_USER_API}`, params))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  onActionRecords(dsrFormRid: number, taskRid: number, recordRid: number, action: string, data: any = null) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${dsrFormRid}/task/${taskRid}/record/${recordRid}/${action}`,
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

  createTask(dsrFormId: any, data: any = null) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${dsrFormId}/task`,
          body: data,
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res
      }))
  }


  createClient(data: any = null) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `idp`,
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

  async getIdpList(showSnackBar: boolean = false): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(IDP_LIST, null, showSnackBar)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching roles:', e);
        return null;
      });
  }

  async updateIdp(id: number, payload: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `idp/${id}`,
        body: payload,
        showSnackBar: true
      })
    ).then(res => res)
      .catch(e => {
        console.error('Error updating user:', e);
        throw e;
      });
  }



  async registrationConfig() {
    return await firstValueFrom(
      this.httpService.httpGet(`idp/registration-config`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }


  async getIdpDetails(idpId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`idp/${idpId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async updateTask(taskData: UpdateTaskRequest): Promise<any> {
    const { taskId, ...requestBody } = taskData;

    return await firstValueFrom(
      this.httpService.httpPatch({
        queryUrl: `tm/task/${taskId}`,
        body: requestBody,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || 'Failed to update task');
        }
        return res;
      })
      .catch(e => {
        console.error('Error updating task:', e);
        throw e;
      });
  }


  editRecord(dsrFormId: number, taskId: number, recordId: number, payload: any) {
    return this.httpService
      .httpPatch(
        {
          queryUrl: `dsr/${dsrFormId}/task/${taskId}/record/${recordId}`,
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


  deleteRecord(dsrFormId: number, taskId: number, recordId: number) {
    return this.httpService.httpDelete(`dsr/${dsrFormId}/task/${taskId}/record/${recordId}`, null, true);
  }


  async getClarificationDetails(clarificationId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`task-management/clarifications/${clarificationId}`, { clarificationId })
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDataFulfillmentRecords(dsrFormId: number, taskId: number, param: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/${dsrFormId}/task/${taskId}/record`, param))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  saveAddRecordDetails(payload: any, dsrFormId: number, taskId: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${dsrFormId}/task/${taskId}/record`,
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

  resolveClarification(clarificationId: number, documents: any[]) {
    return this.httpService
      .httpPost({
        queryUrl: `task-management/clarifications/complete/${clarificationId}`,
        body: { documents },
        showSnackBar: true,
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

  saveSubTaskDetails(parentTaskId: number, data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `task-management/tasks/${parentTaskId}/sub-task`,
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

  async getClarificationsList(dsrFormId: number, params: any = { page: 1, size: 10 }) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/${dsrFormId}/clarification`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching clarifications:', e);
        return null;
      });
  }

  async getTaskComments(dsrFormId: number, taskId: number, param: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/${dsrFormId}/clarification/${taskId}/comments`, param)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  createClarification(dsrFormId: number, data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${dsrFormId}/clarification`,
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

  deleteSubTaskDetails(parentTaskId: number, subTaskId: number) {
    return this.httpService
      .httpDelete(`task-management/tasks/${parentTaskId}/sub-task/${subTaskId}`, null, true)
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  onEditSubTaskDetails(parentTaskId: number, subTaskId: number, body: any) {
    return this.httpService
      .httpPatch(
        {
          queryUrl: `task-management/tasks/${parentTaskId}/sub-task/${subTaskId}`,
          body: body,
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


  updateDataFullfillmentTask(formRid: number, taskRid: number, body: any) {
    return this.httpService
      .httpPatch(
        {
          queryUrl: `dsr/${formRid}/task/${taskRid}`,
          body: body,
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

  deleteDataFullFillmentTask(formRid: number, taskRid: number) {
    return this.httpService
      .httpDelete(`dsr/${formRid}/task/${taskRid}`, null, true)
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  deleteTask(taskId: number) {
    return this.httpService
      .httpDelete(`tm/task/${taskId}`, null, true)
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  saveUserInfo(data: any) {
    return this.httpService
      .httpPut(
        {
          queryUrl: `${AUTH_USER_API}/me`,
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

  async getUserInfo() {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_USER_API}/me`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }


  updateClarification(dsrFormId: number, clarificationId: number, data: any) {
    return this.httpService
      .httpPatch({
        queryUrl: `dsr/${dsrFormId}/clarification/${clarificationId}`,
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

  deleteClarification(dsrFormId: number, clarificationId: number) {
    return this.httpService
      .httpDelete(
        `dsr/${dsrFormId}/clarification/${clarificationId}`, null, true)
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  onTaskAction(taskRid: number, action: string, data: any = null) {
    return this.httpService
      .httpPatch(
        {
          queryUrl: `task/${taskRid}/${action}`,
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

  async getClarificationComments(dsrFormId: number, clarificationId: number, param: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/${dsrFormId}/clarification/${clarificationId}/comments`, param)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  createClarificationComment(dsrFormId: number, clarificationId: number, data: any) {
    const endpoint = `dsr/${dsrFormId}/clarification/${clarificationId}/comments`;

    return this.httpService
      .httpPost({
        queryUrl: endpoint,
        body: data,
        showSnackBar: true,
      })
      .pipe(
        map(res => {
          if (!res.isSuccess) {
            throw new Error(res.message)
          }
          return res.data
        })
      );
  }

  updateClarificationComment(dsrFormId: number, clarificationId: number, commentId: number, data: any) {
    return this.httpService
      .httpPatch({
        queryUrl: `dsr/${dsrFormId}/clarification/${clarificationId}/comments/${commentId}`,
        body: data,
        showSnackBar: true,
      })
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update comment')
        }

        if (!res.message) {
          res.message = 'Comment updated successfully'
        }

        return res.data
      }))
  }

  patchTaskComment(payload: any, dsrFormId: number, taskId: number, commentId: number) {
    return this.httpService.httpPatch({
      queryUrl: `dsr/${dsrFormId}/clarification/${taskId}/comments/${commentId}`,
      body: payload
    });

  }

  patchClarificationComment(payload: any, dsrFormId: number, clarificationId: number, commentId: number,) {
    return this.httpService.httpPatch({
      queryUrl: `dsr/${dsrFormId}/clarification/${clarificationId}/comments/${commentId}`,
      body: payload
    });
  }


  deleteTaskComment(dsrFormId: number, taskId: number, commentId: number) {
    return this.httpService.httpDelete(
      `dsr/${dsrFormId}/clarification/${taskId}/comments/${commentId}`
    );
  }

  deleteClarificationComment(dsrFormId: number, clarificationId: number, commentId: number) {
    return this.httpService
      .httpDelete(`dsr/${dsrFormId}/clarification/${clarificationId}/comments/${commentId}`, true)
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to delete comment')
        }
        return res.data
      }))
  }

  postTaskComment(payload: any, dsrFormId: number, taskId: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${dsrFormId}/clarification/${taskId}/comments`,
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

  async uploadCommentAttachment(file: File, purpose: string = DSR_ATTACHMENT): Promise<{ fileKey: string; eTag: string; fileName: string; fileSize: number; }> {
    try {
      const uploadParams = {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        purpose: purpose
      };

      const presignedResponse = await this.uploadPresignedUrl(uploadParams);

      if (!presignedResponse?.presignedUrl) {
        throw new Error('Failed to get presigned URL for comment attachment');
      }

      const uploadResult = await this.getImageEtag(
        presignedResponse.presignedUrl,
        file
      );

      if (!uploadResult) {
        throw new Error('Failed to upload comment attachment');
      }

      let extractedETag: string;

      if (typeof uploadResult === 'string') {
        extractedETag = uploadResult;
      } else if (uploadResult && typeof uploadResult === 'object') {
        const responseBody = (uploadResult as any).body;
        const responseHeaders = (uploadResult as any).headers;

        if (responseBody?.eTag) {
          extractedETag = responseBody.eTag;
        }
        else if (responseHeaders?.etag || responseHeaders?.ETag) {
          extractedETag = responseHeaders.etag || responseHeaders.ETag;
        }
        else if ((uploadResult as any).eTag) {
          extractedETag = (uploadResult as any).eTag;
        }
        else {
          console.warn('eTag not found in response, using fallback identifier');
          extractedETag = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      } else {
        extractedETag = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      return { fileKey: presignedResponse.fileKey, eTag: extractedETag, fileName: file.name, fileSize: file.size };

    } catch (error) {
      console.error('Error uploading comment attachment:', error);
      throw new Error(`Comment attachment upload failed: ${error}`);
    }
  }

  async uploadMultipleCommentAttachments(files: File[]): Promise<Array<{ fileKey: string; eTag: string; fileName: string; fileSize: number; }>> {
    const uploadPromises = files.map(file => this.uploadCommentAttachment(file));
    return Promise.all(uploadPromises);
  }

  resolveDsrClarification(dsrFormId: number, clarificationId: number, resolutionNote: string = ''): Observable<any> {
    const body = { note: resolutionNote.trim() };
    return this.httpService
      .httpRequestWithHeader({
        queryUrl: `dsr/${dsrFormId}/clarification/${clarificationId}/resolve`,
        body,
        showSnackBar: true,
        showSnackBarOnError: true
      })
      .pipe(
        map((res: any) => {
          const responseBody = res.body as {
            success?: boolean;
            message?: string;
            data?: any;
            requestId?: string;
          };
          if (responseBody.success === false) {
            throw new Error(responseBody.message || 'Failed to resolve clarification');
          }
          return responseBody.data || responseBody;
        }),
        catchError((error: any) => {
          console.error('Resolve clarification API error:', error);
          let errorMessage = 'Failed to resolve clarification';
          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          throw new Error(errorMessage);
        })
      );
  }

  postClarificationComment(payload: { content: string; parentId?: number; attachments?: { fileKey: string; eTag?: string }[]; metadata?: { mentionedUserIds: number[] }; }, dsrFormId: number, clarificationId: number) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `dsr/${dsrFormId}/clarification/${clarificationId}/comments`,
          body: payload,
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to complete clarification')
        }
        return res.data
      }))
  }

  completeClarificationWithDocuments(clarificationId: number, documents: string[]) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `task-management/clarifications/complete/${clarificationId}`,
          body: { documents },
          showSnackBar: true,
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to complete clarification')
        }
        return res.data
      }))
  }

  async searchUsers(query: string, params: any = null) {
    try {
      const res = await firstValueFrom(
        this.httpService.httpGet(`${AUTH_USER_API}/search?query=${query}`, params)
      );
      return res?.data || [];
    } catch (e) {
      console.error('Error searching users', e);
      return [];
    }
  }

  async getAuditLogs(auditLogModule: string, entityType: string, entityId: number, params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`audits/${auditLogModule}/${entityType}/${entityId}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getCentralAuditLogs(params: any = null, userId: number = 0) {
    return await firstValueFrom(
      this.httpService.httpGet(`central-auth/audit-logs/${userId}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  assignDsrRequest(data: { toUserId: number }, formRid: number): Observable<any> {
    return this.httpService.httpPost({
      queryUrl: `dsr/${formRid}/assign`,
      params: { assigneeId: data.toUserId },
      body: {},
      showSnackBar: true,
    }).pipe(map(res => {
      if (!res.isSuccess) {
        throw new Error(res.message)
      }
      return res.data
    }))
  }

  async addDepartment(data: { name: string; description: string }): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `${AUTH_DEPARTMENT_API}`,
        body: data,
        showSnackBar: true,
      })
    ).then(res => {
      if (!res.isSuccess) throw new Error(res.message);
      return res.data;
    });
  }


  createAsset(data: any) {
    return this.httpService
      .httpPost(
        {
          queryUrl: `data-inventory/assets`,
          body: data,
          showSnackBar: true,
          showSnackBarOnError: true
        }
      )
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }


  onPatchAssetData(data: any, assetId: number) {
    return this.httpService.httpPatch({
      queryUrl: `data-inventory/assets/${assetId}`,
      body: data,
      showSnackBar: true,
    }).pipe(
      map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message);
        }
        return res.data;
      })
    );
  }

  onTaskActionForRespondent(data: any, taskId: number, operation: string) {
    return this.httpService
      .httpPatch({
        queryUrl: `tm/task/${taskId}/${operation}`,
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

  async getDashboardDetails() {
    return await firstValueFrom(
      this.httpService.httpGet(`dsr/dashboard-details`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching task details:', e);
        return null;
      });
  }

  async getEmailTemplateById(templateId: string) {
    return await firstValueFrom(
      this.httpService.httpGet(`notification-service/templates/trigger-points/${templateId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching email template:', e);
        return null;
      });
  }

  sendRejectionEmail(data: any, requestId: number) {
    return this.httpService
      .httpPost({
        queryUrl: `dsr/${requestId}/send-rejection-email`,
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

  async getNotification(params: any) {
    return await firstValueFrom(
      this.httpService.httpGet(NOTIFICATION_LIST, params))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getUnreadNotificationCount() {
    return await firstValueFrom(
      this.httpService.httpGet(NOTIFICATION_UNREAD_COUNT, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async markNotificationAsRead(traceId: string) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: NOTIFICATION_MARK_READ,
        params: { traceId },
        body: {},
        showSnackBar: false,
      }))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async markAllNotificationsAsRead() {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: NOTIFICATION_MARK_ALL_READ,
        body: {},
        showSnackBar: true,
      }))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  deleteOption(dsrFormId: number) {
    return this.httpService
      .httpDelete(`dsr/${dsrFormId}`, null, true)
      .pipe(map(res => {
        if (!res.isSuccess) {
          throw new Error(res.message)
        }
        return res.data
      }))
  }

  async addPurpose(data: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `bpa/purpose`,
        body: data,
        showSnackBar: true,
        showSnackBarOnError: true
      }).pipe(
        map(res => {
          if (!res.isSuccess) throw new Error(res.message);
          return res.data;
        })
      )
    );
  }

  draftManual(data: any) {
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



  async getPurposeList() {
    return await firstValueFrom(
      this.httpService.httpGet(`bpa/purpose`, null))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  verifyExternalUserSession(body: { email: string }): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: EXTERNAL_AUTH_LOGIN,
        body: body,
        showSnackBar: true,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to send OTP');
          }
          return res;
        }),
        catchError(error => {
          console.error('External auth login failed:', error);
          let errorMessage = 'Failed to send OTP';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }


  validateExternalUserOtp(body: any): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: EXTERNAL_AUTH_VALIDATE,
        body: body,
        showSnackBar: false,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Invalid OTP');
          }
          return res;
        }),
        catchError(error => {
          console.error('External auth OTP validation failed:', error);
          let errorMessage = 'Failed to verify OTP';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }




  verifyInternalUserSession(body: { email: string }): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: INTERNAL_AUTH_LOGIN,
        body: body,
        showSnackBar: true,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to send OTP');
          }
          return res;
        }),
        catchError(error => {
          console.error('Internal auth login failed:', error);
          let errorMessage = 'Failed to send OTP';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  validateInternalUserOtp(body: any): Observable<any> {
    return this.httpService
      .httpPost({
        queryUrl: INTERNAL_AUTH_VALIDATE,
        body: body,
        showSnackBar: false,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Invalid OTP');
          }
          return res;
        }),
        catchError(error => {
          console.error('Internal auth OTP validation failed:', error);
          let errorMessage = 'Failed to verify OTP';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  createRisk(riskData: CreateRiskRequest): Observable<CreateRiskResponse> {
    return this.httpService
      .httpPost({
        queryUrl: CREATE_RISK,
        body: riskData,
        showSnackBar: true,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to create risk');
          }
          return res;
        }),
        catchError(error => {
          console.error('Risk creation failed:', error);
          let errorMessage = 'Failed to create risk';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  createQuestionRisk(questionId: number, riskData: CreateRiskRequest): Observable<CreateRiskResponse> {
    return this.httpService
      .httpPost({
        queryUrl: `assessment/question/${questionId}/risk`,
        body: riskData,
        showSnackBar: true,
      })
      .pipe(
        map(res => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to create risk');
          }
          return res;
        }),
        catchError(error => {
          console.error('Question risk creation failed:', error);
          let errorMessage = 'Failed to create risk';

          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  async getRisks(): Promise<GetRisksResponse> {
    return await firstValueFrom(
      this.httpService.httpGet(RISK_LIST)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error fetching risks:', e);
        throw e;
      });
  }

  async getCollectionPoints(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/source/collection-point`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching collection points', e);
        return null;
      });
  }


  async getCollectionPointDetails(collectionPointId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/source/collection-point/${collectionPointId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error fetching collection point details', e);
        return null;
      });
  }

  async editVendorDetails(data: any = null, id: number, showSnackBar: boolean = true) {
    return await firstValueFrom(
      this.httpService.httpPatch({
        queryUrl: `data-inventory/vendor/${id}`,
        body: data,
        showSnackBar: showSnackBar,
      })
    )
      .then(res => res.data || res)
      .catch(e => { console.error('API Error:', e); throw e; });
  }

  async updateVendor(payload: { commandId: string; commands: any[] }, vendorId: number,): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPatch({
        queryUrl: `data-inventory/vendor/${vendorId}`,
        body: payload,
        showSnackBar: true,
      })
    )
      .then(res => res.data || res)
      .catch(e => { console.error('API Error:', e); throw e; });
  }

  async getVendorsDetails(params: any = null, id: any = null): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/vendor/${id}`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getServiceTypeDetails(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/service-type`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async getThirdPartyTypeDetails(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`data-inventory/third-party-vendor-type`)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async deletevendor(id: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`data-inventory/vendor/${id}`, null, null, true)
    )
      .then(res => res)
      .catch(e => {
        console.error('Error deleting user:', e);
        throw e;
      });
  }

  // Method to import Data Subjects
  async importDataSubjects(payload: BulkImportDsPayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `configuration/pd-inventory/bulk/import/ds`,
        body: payload,
        showSnackBar: true
      }).pipe(map(res => {
        if (!res.isSuccess) throw new Error(res.message);
        return res.data;
      }))
    );
  }

  // Method to import Personal Data Elements
  async importPdElements(payload: BulkImportPdPayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `configuration/pd-inventory/bulk/import/pd`,
        body: payload,
        showSnackBar: true
      }).pipe(map(res => {
        if (!res.isSuccess) throw new Error(res.message);
        return res.data;
      }))
    );
  }

  async pdInventory(payload: any): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `configuration/pd-inventory`,
        body: payload,
        showSnackBar: true
      }).pipe(map(res => {
        if (!res.isSuccess) throw new Error(res.message);
        return res.data;
      }))
    );
  }



  // Method to import BPA Purposes
  async importBpaPurposes(payload: BulkImportPurposePayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `pd-inventory/bulk/import/bpa-purpose`,
        body: payload,
        showSnackBar: true
      }).pipe(map(res => {
        if (!res.isSuccess) throw new Error(res.message);
        return res.data;
      }))
    );
  }

  // Method to import Assets
  async importAssets(payload: BulkImportAssetPayload): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `pd-inventory/bulk/import/asset`,
        body: payload,
        showSnackBar: true
      }).pipe(map(res => {
        if (!res.isSuccess) throw new Error(res.message);
        return res.data;
      }))
    );
  }

  async getRiskList(params: any = null, assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/${assessmentId}/risks`, params)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async addMeaures(data: any = null, riskId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/risk/${riskId}/measure`,
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

  async viewMeasure(riskId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`assessment/risk/${riskId}/measure`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async deleteRisk(riskId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`assessment/risk/${riskId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async deleteMeasure(riskId: number, measureId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpDelete(`assessment/risk/${riskId}/measure/${measureId}`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async updateRiskMeasure(body: any, riskId: number, measureId: number): Promise<any> {

    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `assessment/risk/${riskId}/measure/${measureId}`,
        body: body,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update measure');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating measure:', e);
        throw e;
      });
  }

  async updateRisk(body: any, riskId: number): Promise<any> {

    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `assessment/risk/${riskId}`,
        body: body,
        showSnackBar: true
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message || 'Failed to update measure');
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating measure:', e);
        throw e;
      });
  }


  async approveMeasure(operation: 'APPROVED' | 'REJECTED', data: any = null, riskId: number, measureId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/risk/${riskId}/measure/${measureId}/${operation}`,
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


  async sendForApproval(data: any = null, assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/send-for-approval`,
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

  async approverFinalSubmit(data: any = null, assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}/approved`,
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


  async assessmentUpdate(data: any = null, assessmentId: number): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `assessment/${assessmentId}`,
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

  async postConversationMessage(dsrFormId: number, body: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `dsr-form-conversation/${dsrFormId}`,
        body: body,
        showSnackBar: true,
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error posting conversation message:', e);
        throw e;
      });
  }

  async deleteConversationMessage(dsrFormId: number, messageId: number) {
    return await firstValueFrom(
      this.httpService.httpDelete(
        `dsr-form-conversation/${dsrFormId}/${messageId}`,
        null,
        null,
        true,
        true
      )
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error deleting conversation message:', e);
        throw e;
      });
  }

  async updateConversationMessage(dsrFormId: number, messageId: number, body: any) {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `dsr-form-conversation/${dsrFormId}/${messageId}`,
        body: body,
        showSnackBar: true,
      })
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating conversation message:', e);
        throw e;
      });
  }

  async getConversationMessages(dsrFormId: number, page: number = 0, size: number = 10) {
    const params = {
      page: page,
      size: size
    };

    return await firstValueFrom(
      this.httpService.httpGet(`dsr-form-conversation/${dsrFormId}`, params, false, true)
    )
      .then(res => {
        if (!res.isSuccess) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error fetching conversation messages:', e);
        throw e;
      });
  }



  async getRefreshToken(params: any = null) {
    return await firstValueFrom(
      this.httpService.httpGet(`${AUTH_REFRESH_TOKEN}`, params, false, true, true))
      .then(res => res.data)
      .catch(e => {
        console.error('Error', e);
        return null;
      });
  }

  async getDiscussionLogMessageInfo(messageId: number, size: number = 10) {
    return await firstValueFrom(
      this.httpService.httpGet(`task-conversation/${messageId}/${size}`, null, false, true)
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error fetching discussion log message info:', e);
        throw e;
      });
  }


  async getDiscussionLogMessages(
    taskId: number,
    page: number = 1,
    size: number = 10,
    messageId?: number,
    depthOfChildMessage?: number,
    discussionType?: 'REMARK' | 'RESPONSE'
  ) {
    const params: any = {
      page: page,
      size: size
    };

    if (messageId) params.messageId = messageId;
    if (depthOfChildMessage) params.depthOfChildMessage = depthOfChildMessage;
    if (discussionType) params.discussionType = discussionType;

    return await firstValueFrom(
      this.httpService.httpGet(`task-conversation/${taskId}`, params, false, true)
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error fetching discussion log messages:', e);
        throw e;
      });
  }

  async postDiscussionLogMessage(taskId: number, body: any) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `task-conversation/${taskId}`,
        body: body,
        showSnackBar: true,
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error posting discussion log message:', e);
        throw e;
      });
  }

  async updateDiscussionLogMessage(taskId: number, messageId: number, body: any) {
    return await firstValueFrom(
      this.httpService.httpPut({
        queryUrl: `task-conversation/${taskId}/${messageId}`,
        body: body,
        showSnackBar: true,
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error updating discussion log message:', e);
        throw e;
      });
  }

  async deleteDiscussionLogMessage(taskId: number, messageId: number) {
    return await firstValueFrom(
      this.httpService.httpDelete(
        `task-conversation/${taskId}/${messageId}`,
        null,
        null,
        true,
        true
      )
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error deleting discussion log message:', e);
        throw e;
      });
  }

  async getDiscussionLogAttachments(taskId: number) {
    return await firstValueFrom(
      this.httpService.httpGet(`task-conversation/${taskId}/attachments`, null, false, true)
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data?.taskAttachmentListing || [];
      })
      .catch(e => {
        console.error('Error fetching discussion log attachments:', e);
        return [];
      });
  }

  async getIdpConfigs(): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`login`)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }

  async switchEntity(entityId: string): Promise<any> {
    return await firstValueFrom(
      this.httpService.httpGet(`organization/switch`, { entityId: entityId })
    )
      .then(res => res)
      .catch(e => {
        console.error('Error:', e);
        throw e;
      });
  }


  async getAllLabels(): Promise<Array<{ id: number; name: string; isDeleted: boolean }>> {
    return await firstValueFrom(
      this.httpService.httpGet('assessment/task-label')
    )
      .then(res => res?.data?.labels || [])
      .catch(e => {
        console.error('Error fetching labels:', e);
        return [];
      });
  }

  async uploadTaskAttachments(taskId: number, attachments: any[]) {
    return await firstValueFrom(
      this.httpService.httpPost({
        queryUrl: `task-conversation/${taskId}/attachments`,
        body: { taskAttachments: attachments },
        showSnackBar: true,
      })
    )
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error uploading task attachments:', e);
        throw e;
      });
  }

  async deleteTaskAttachment(taskId: number, attachmentId: number) {
    const params = { attachmentIds: [attachmentId] };

    return await firstValueFrom(
      this.httpService.httpDelete(
        `task-conversation/${taskId}/attachments`,
        params,
        null,
        true,
        true
      ))
      .then(res => {
        if (!res.success) {
          throw new Error(res.message);
        }
        return res.data;
      })
      .catch(e => {
        console.error('Error deleting task attachment:', e);
        throw e;
      });
  }



  async getAssessmentTaskConversation(assessmentId: number, taskId: number, conversationPageNo: number = 1, conversationId?: number, depthOfChildMessageCount?: number): Promise<any> {
    let url = `${CREATE_ASSESSMENT}/${assessmentId}/${taskId}/conversations?conversationPageNo=${conversationPageNo}&conversationSize=10`;
    if (conversationId) {
      url += `&conversationId=${conversationId}`;
    }
    if (depthOfChildMessageCount) {
      url += `&depthOfChildMessageCount=${depthOfChildMessageCount}`;
    }
    return await firstValueFrom(
      this.httpService.httpGet(url)
    )
      .then(res => res.data)
      .catch(e => {
        console.error('Error:', e);
        return null;
      });
  }
}


