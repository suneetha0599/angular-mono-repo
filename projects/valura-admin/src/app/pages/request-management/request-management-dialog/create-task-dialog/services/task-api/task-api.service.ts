import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { convertToApiStageFormat } from '../../constants/task.constants';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { USER_PURPOSE, UserPurpose } from '@admin-core/constants/api-constants';
import {
  CreateTaskRequest,
  DocumentListResponse,
  DataFulfillmentRecordsResponse,
  FileUploadParams
} from '../../models/task-dto.model';
import { TaskStateService } from '../task-state/task-state.service';
import { UpdateTaskRequest } from '../../models/task-dto.model';
export interface InternalUserResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: {
    applicationUserId: number;
    displayName?: string;
    email: string;
  };
  error?: string;
}
export interface CreateDataSubjectTaskRequest {
  dsrStage: string;
  title: string;
  description: string;
  documentRequired: boolean;
  priority: string;
  formUserId: number;
  dueDate?: string;
  notificationData?: {
    notifyTo: string;
    subject: string;
    body: string;
  } | null;
}

export interface ExternalUserRequest {
  email: string;
}

export interface ExternalUserResponse {
  success: boolean;
  message: string;
  requestId: string;
  data: {
    applicationUserId: number;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {
  private readonly apiHelperService = inject(ApiHelperService);
  private readonly httpService = inject(HttpService);
  private readonly taskStateService = inject(TaskStateService);

  updateDataFulfillmentTask(
    requestRid: number,
    taskId: number,
    taskData: UpdateTaskRequest
  ): Observable<any> {
    return this.apiHelperService.updateDataFullfillmentTask(requestRid, taskId, taskData);
  }

  updateSubTask(
    parentTaskId: number,
    taskId: number,
    taskData: UpdateTaskRequest
  ): Observable<any> {
    return this.apiHelperService.onEditSubTaskDetails(parentTaskId, taskId, taskData);
  }

  createSubTask(
    parentTaskId: number,
    taskData: CreateTaskRequest,
    requestService?: RequestManagementService,
    componentStage?: string
  ): Observable<any> {
    let apiStageFormat: string;

    if (requestService && componentStage) {
      const mappedStage = requestService.getStageForTask(componentStage);
      apiStageFormat = convertToApiStageFormat(mappedStage);
    } else {
      const currentStage = this.taskStateService.currentStage();
      apiStageFormat = convertToApiStageFormat(currentStage || 'VERIFICATION');
    }

    const enhancedTaskData = {
      ...taskData,
      stage: apiStageFormat
    };

    return this.apiHelperService.saveSubTaskDetails(parentTaskId, enhancedTaskData);
  }

  createDataFulfillmentTask(
    requestRid: number,
    taskData: CreateTaskRequest,
    requestService?: RequestManagementService,
    componentStage?: string
  ): Observable<any> {
    let stageValue: string;

    if (requestService && componentStage) {
      stageValue = requestService.getStageForTask(componentStage);
    } else {
      const currentStage = this.taskStateService.currentStage();
      stageValue = currentStage || 'REQUEST_VERIFICATION';
    }

    const enhancedTaskData = {
      ...taskData,
      stage: stageValue
    };

    return this.apiHelperService.createDsrTask(requestRid, enhancedTaskData).pipe(
      tap(() => { }),
      catchError(error => {
        let userFriendlyMessage = 'Failed to create task';

        if (error?.message?.includes('state machine')) {
          userFriendlyMessage = 'Cannot create task at this stage. Please ensure all previous workflow steps are completed.';
        } else if (error?.message?.includes('transitions and guards')) {
          userFriendlyMessage = 'Task creation blocked by workflow rules. Please verify prerequisites and try again.';
        } else if (error?.message?.includes('UNKNOWN')) {
          userFriendlyMessage = 'Task creation failed due to workflow validation. Please check the request status and try again.';
        }

        return throwError(() => new Error(userFriendlyMessage));
      })
    );
  }

  createDataSubjectTask(
    requestRid: number,
    taskData: CreateDataSubjectTaskRequest,
    componentStage?: string,
    requestService?: RequestManagementService
  ): Observable<any> {
    let apiStageFormat: string;

    if (requestService && componentStage) {
      const mappedStage = requestService.getStageForTask(componentStage);
      apiStageFormat = convertToApiStageFormat(mappedStage);
    } else {
      const currentStage = this.taskStateService.currentStage();
      apiStageFormat = convertToApiStageFormat(currentStage || 'VALIDATION');
    }

    const enhancedTaskData = {
      ...taskData,
      dsrStage: apiStageFormat
    };

    return this.apiHelperService.createDataSubjectTask(requestRid, enhancedTaskData);
  }

  getOrCreateExternalUser(email: string, purpose: UserPurpose = USER_PURPOSE.DSR_TASK): Observable<ExternalUserResponse> {
    const requestBody = { email, purpose };
    return this.apiHelperService.getOrCreateExternalUser(requestBody);
  }

  getOrCreateInternalUser(email: string, purpose: UserPurpose = USER_PURPOSE.DSR_TASK): Observable<InternalUserResponse> {
    const requestBody = { email, purpose };
    return this.apiHelperService.getOrCreateInternalUser(requestBody);
  }
  async getDocumentList(requestRid: number, params: any): Promise<DocumentListResponse> {
    return this.apiHelperService.getDocumentList(requestRid, params);
  }

  async getDataFulfillmentRecords(
    requestRid: number,
    taskRid: number
  ): Promise<DataFulfillmentRecordsResponse> {
    return this.apiHelperService.getDataFufillmentRecords(requestRid, taskRid);
  }

  async uploadPresignedUrl(params: FileUploadParams): Promise<any> {
    try {
      const response = await this.apiHelperService.uploadPresignedUrl(params);

      if (response && response.fileKey && response.presignedUrl) {
        return response;
      } else if (response && response.data && response.data.fileKey && response.data.presignedUrl) {
        return response.data;
      }

      throw new Error('Upload response missing required fileKey or presignedUrl');
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      throw new Error('Failed to get presigned URL for file upload');
    }
  }

  async getImageEtag(presignedUrl: string, file: File): Promise<any> {
    try {
      const result = await this.apiHelperService.getImageEtag(presignedUrl, file);

      if (result && this.httpService.isHttpSuccess(result?.status)) {
        return result;
      }

      throw new Error('File upload to cloud storage failed');
    } catch (error) {
      console.error('Error uploading file to cloud storage:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }


  async updateTask(taskData: UpdateTaskRequest): Promise<any> {
    return this.apiHelperService.updateTask(taskData);
  }
}
