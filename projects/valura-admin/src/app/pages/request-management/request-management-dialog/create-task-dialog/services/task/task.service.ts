import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { TaskApiService, CreateDataSubjectTaskRequest } from '../task-api/task-api.service';
import { TaskStateService, AssigneeType, AssigneeSelection } from '../task-state/task-state.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { DocumentService } from '../document/document.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DsrFormRequestedUserDetails, RequestTask } from '@admin-core/models/request-management/DsrRequest';
import { CreateTaskRequest, TaskFormData, ApplicationUserTaskRequest } from '../../models/task-dto.model';
import { DialogType, ValidationError } from '../../models/task.types';
import { RequestDialogTypes } from '../../../../constant';
import { TaskValidators } from '../../validators/task.validators';
import { TaskUtils } from '../../utils/task.utils';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { User } from '@admin-core/models/user.model';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { UpdateTaskRequest } from '../../models/task-dto.model';
import { USER_TYPES } from '@admin-core/constants/constants';
import { UserService } from '@admin-core/services/user/user.service';
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly taskApiService = inject(TaskApiService);
  private readonly taskStateService = inject(TaskStateService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly documentService = inject(DocumentService);
  private readonly userService = inject(UserService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly apiHelperService = inject(ApiHelperService);


  async initializeTaskForm(
    dialogType: DialogType,
    requestRid: number,
    task?: RequestTask,
    isEditMode: boolean = false,
    isRiskMitigation: boolean = false
  ): Promise<void> {
    this.taskStateService.setSubmitLoading(false);
    this.taskStateService.clearFormErrors();

    if (this.isTaskFormDialog(dialogType)) {
      if (!isEditMode) {
        await this.loadUserMasterList(USER_TYPES);
        await this.documentService.loadInitialDocuments();
        if (!isRiskMitigation) {
          await this.loadDsrRequestDetails(requestRid);
        }
      }

      if (task?.attachments) {
        this.taskStateService.setUploadedFiles([...task.attachments]);
      }
    }
  }
  private async loadDsrRequestDetails(requestRid: number): Promise<void> {
    try {
      const data = await this.apiHelperService.getDsrRequestDetails(requestRid, { isDraft: false });
      if (data) {
        this.taskStateService.setDsrRequestDetails(data);
        if (data.dsrFormRequestedUserDetails) {
          this.taskStateService.setDsrFormRequestedUser(data.dsrFormRequestedUserDetails);
        }
      }
    } catch (error) {
      console.error('Failed to load DSR request details:', error);
      this.snackbarService.openSnack('Failed to load request details');
    }
  }


  private async prepareFormData(form: FormGroup, notificationData?: any): Promise<ApplicationUserTaskRequest | null> {
    const formValue: TaskFormData = form.getRawValue();
    const assigneeType = formValue.assigneeType || form.get('assigneeType')?.value;
    const assigneeId = formValue.assignee || form.get('assignee')?.value;

    let formattedDate = '';
    if (formValue.dueDate) {
      formattedDate = TaskUtils.formatDate(formValue.dueDate);
    }

    const formData: ApplicationUserTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      dueDate: formattedDate,
      priority: formValue.priority,
      assignTo: Number(assigneeId),
      documentAttached: [],
      stage: '',
      type: 'DSR_TASK',
      documentRequired: formValue.documentRequired,
      userId: Number(assigneeId),
      assignToUserType: 'INTERNAL_USER',
      actorType: 'ADMIN_USER',
      notificationData: notificationData?.notificationData || null
    };

    const allFileKeys: string[] = [];
    const selectedDocumentUrls: string[] = [];

    try {
      const uploadedFiles = this.taskStateService.uploadedFiles();
      if (uploadedFiles.length > 0) {
        const manualUploadKeys = await this.fileUploadService.processAttachmentsForSubmission(uploadedFiles);
        if (Array.isArray(manualUploadKeys)) {
          const validKeys = manualUploadKeys.filter(key =>
            key &&
            typeof key === 'string' &&
            key.trim() !== '' &&
            key !== 'string' &&
            !key.toLowerCase().includes('undefined') &&
            !key.toLowerCase().includes('null')
          );
          allFileKeys.push(...validKeys);
        }
      }

      const selectedDocumentKeys = await this.documentService.processSelectedDocumentsForSubmission();
      if (Array.isArray(selectedDocumentKeys)) {
        const validDocKeys = selectedDocumentKeys.filter(key =>
          key &&
          typeof key === 'string' &&
          key.trim() !== '' &&
          key !== 'string' &&
          !key.toLowerCase().includes('undefined') &&
          !key.toLowerCase().includes('null')
        );
        allFileKeys.push(...validDocKeys);
      }

      const documentUrls = this.documentService.getSelectedDocumentUrls();
      if (Array.isArray(documentUrls)) {
        const validUrls = documentUrls.filter(url =>
          url &&
          typeof url === 'string' &&
          url.trim() !== '' &&
          url !== 'string' &&
          !url.toLowerCase().includes('undefined') &&
          !url.toLowerCase().includes('null')
        );
        selectedDocumentUrls.push(...validUrls);
      }

    } catch (error) {
      console.error('TaskService.prepareFormData - Error processing documents:', error);
    }

    const cleanedDocuments = [...new Set([...allFileKeys, ...selectedDocumentUrls])]
      .filter(item =>
        item &&
        typeof item === 'string' &&
        item.trim() !== '' &&
        item !== 'string' &&
        !item.toLowerCase().includes('undefined') &&
        !item.toLowerCase().includes('null')
      );

    formData.documentAttached = cleanedDocuments;
    return formData;
  }
  private validateTaskCreationEligibility(dsrDetails: any, componentStage?: string): { eligible: boolean; reason: string } {
    if (!dsrDetails) {
      return { eligible: false, reason: 'DSR request details not available' };
    }

    const currentState = dsrDetails.dsrDetails?.state;
    const stageMeta = dsrDetails.stageMeta;

    if (!currentState) {
      return { eligible: false, reason: 'DSR request state is undefined' };
    }

    if (currentState === 'DATA_DISCOVERED' && componentStage === 'REQUEST_FULFILLMENT') {
      if (stageMeta) {
        const dataFulfilmentStatus = stageMeta.dataFulfilment;

        if (dataFulfilmentStatus === 1) {
          return { eligible: true, reason: '' };
        }

        if (dataFulfilmentStatus === 0) {
          return {
            eligible: false,
            reason: 'Data fulfillment stage has not been started. Please initiate the data fulfillment process first.'
          };
        }

        if (dataFulfilmentStatus === 2) {
          return {
            eligible: false,
            reason: 'Data fulfillment stage is already completed. Cannot create new tasks in completed stage.'
          };
        }
      }
    }

    if (componentStage === 'REQUEST_FULFILLMENT') {
      const requiredStages = ['verification', 'validation', 'dataMapping'];

      if (stageMeta) {
        const incompleteStages = requiredStages.filter(stage => {
          const stageStatus = stageMeta[stage];
          return stageStatus !== 2;
        });

        if (incompleteStages.length > 0) {
          return {
            eligible: false,
            reason: `Complete ${incompleteStages.join(', ')} stages before creating fulfillment tasks`
          };
        }
      }
    }

    return { eligible: true, reason: '' };
  }

  async submitTask(
    dialogType: DialogType,
    requestRid: number,
    parentTaskId: number,
    form: FormGroup,
    existingTask?: RequestTask,
    componentStage?: string,
    requestService?: RequestManagementService,
    notificationData?: any,
    effectiveAssigneeType?: string
  ): Promise<void> {

    if (!this.validateForm(form, effectiveAssigneeType) || !this.taskStateService.canSubmit()) {
      if (this.taskStateService.fileUploadInProgress()) {
        this.snackbarService.openSnack('Please wait for file upload to complete');
      }
      if (this.taskStateService.externalUserLoading()) {
        this.snackbarService.openSnack('Please wait for external user processing to complete');
      }
      return;
    }

    if (!existingTask) {
      const dsrDetails = this.taskStateService.dsrRequestDetails();

      if (dsrDetails) {
        const validation = this.validateTaskCreationEligibility(dsrDetails, componentStage);

        if (!validation.eligible) {
          this.snackbarService.openSnack(validation.reason);
          return;
        }
      } else {
        console.warn('TaskService.submitTask - No DSR details available for validation');
        this.snackbarService.openSnack('Unable to validate DSR request state. Please refresh and try again.');
        return;
      }
    }

    this.taskStateService.setSubmitLoading(true);

    try {
      const assigneeType = effectiveAssigneeType || form.get('assigneeType')?.value;

      if (existingTask) {
        await this.submitTaskUpdate(form, existingTask, notificationData, effectiveAssigneeType);
        return;
      }

      if (assigneeType === 'DATA_SUBJECT') {
        await this.submitDataSubjectTask(requestRid, form, componentStage, requestService, notificationData);
      } else if (assigneeType === 'INTERNAL') {
        await this.submitApplicationUserTask(dialogType, requestRid, parentTaskId, form, existingTask, componentStage, requestService, notificationData);
      } else if (assigneeType === 'EXTERNAL') {
        await this.submitExternalUserTask(dialogType, requestRid, parentTaskId, form, existingTask, componentStage, requestService, notificationData);
      }
    } catch (error: any) {
      console.error('TaskService.submitTask - Submission failed:', error);
      this.taskStateService.setSubmitLoading(false);

      let errorMessage = 'Failed to process task';
      if (error?.message?.includes('state machine')) {
        errorMessage = 'Cannot create task at this stage. Please ensure all previous stages are completed and try again.';
      } else if (error?.message?.includes('transitions and guards')) {
        errorMessage = 'Task creation blocked by workflow rules. Please check prerequisites and try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      this.snackbarService.openSnack(errorMessage);
      throw error;
    }
  }
  private async prepareExternalUserFormData(
    form: FormGroup,
    applicationUserId: number,
    notificationData?: any
  ): Promise<ApplicationUserTaskRequest | null> {
    const formValue: TaskFormData = form.getRawValue();

    const formData: ApplicationUserTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      dueDate: TaskUtils.formatDate(formValue.dueDate),
      priority: formValue.priority,
      type: 'DSR_TASK',
      assignTo: applicationUserId,
      documentAttached: [],
      stage: '',
      documentRequired: formValue.documentRequired,
      userId: applicationUserId,
      assignToUserType: 'EXTERNAL_USER',
      actorType: 'ADMIN_USER',
      notificationData: notificationData?.notificationData || null
    };

    const allFileKeys: string[] = [];
    const selectedDocumentUrls: string[] = [];

    const uploadedFiles = this.taskStateService.uploadedFiles();
    if (uploadedFiles.length > 0) {
      const manualUploadKeys = await this.fileUploadService.processAttachmentsForSubmission(uploadedFiles);
      allFileKeys.push(...manualUploadKeys);
    }

    const selectedDocumentKeys = await this.documentService.processSelectedDocumentsForSubmission();
    allFileKeys.push(...selectedDocumentKeys);

    const documentUrls = this.documentService.getSelectedDocumentUrls();
    selectedDocumentUrls.push(...documentUrls);

    formData.documentAttached = [...new Set([...allFileKeys, ...selectedDocumentUrls])];

    return formData;
  }

  private async submitTaskUpdate(
    form: FormGroup,
    existingTask: RequestTask,
    notificationData?: any,
    effectiveAssigneeType?: string
  ): Promise<void> {
    try {
      const updateData = await this.prepareTaskUpdateData(form, existingTask, notificationData, effectiveAssigneeType);
      await this.taskApiService.updateTask(updateData);
      this.taskStateService.setSubmitLoading(false);
      this.snackbarService.openSnack('Task updated successfully');
    } catch (error) {
      console.error('Task update failed:', error);
      this.taskStateService.setSubmitLoading(false);
      this.snackbarService.openSnack('Failed to update task');
      throw error;
    }
  }

  private async prepareTaskUpdateData(
    form: FormGroup,
    task: RequestTask,
    notificationData?: any,
    effectiveAssigneeType?: string
  ): Promise<UpdateTaskRequest> {
    const formValue: TaskFormData = form.getRawValue();
    const assigneeType = effectiveAssigneeType || formValue.assigneeType || form.get('assigneeType')?.value;

    let assignTo: number;
    let assignToUserType: string;

    if (assigneeType === 'INTERNAL') {
      assignTo = Number(formValue.assignee);
      assignToUserType = 'INTERNAL_USER';
    } else if (assigneeType === 'DATA_SUBJECT') {
      const formUserId = this.taskStateService.getFormUserId();
      if (!formUserId) {
        throw new Error('DSR form user ID not available for data subject task update');
      }
      assignTo = formUserId;
      assignToUserType = 'DATA_SUBJECT';
    } else if (assigneeType === 'EXTERNAL') {
      const externalUser = this.taskStateService.externalUser();
      if (!externalUser?.applicationUserId) {
        throw new Error('External user information not available');
      }
      assignTo = externalUser.applicationUserId;
      assignToUserType = 'EXTERNAL_USER';
    } else {
      throw new Error('Invalid assignee type selected');
    }

    const allFileKeys: string[] = [];
    const selectedDocumentUrls: string[] = [];

    const uploadedFiles = this.taskStateService.uploadedFiles();
    if (uploadedFiles.length > 0) {
      const manualUploadKeys = await this.fileUploadService.processAttachmentsForSubmission(uploadedFiles);
      allFileKeys.push(...manualUploadKeys);
    }

    const selectedDocumentKeys = await this.documentService.processSelectedDocumentsForSubmission();
    allFileKeys.push(...selectedDocumentKeys);

    const documentUrls = this.documentService.getSelectedDocumentUrls();
    selectedDocumentUrls.push(...documentUrls);

    const currentDocuments = [...new Set([...allFileKeys, ...selectedDocumentUrls])];

    const originalDocuments = this.getOriginalDocuments(task);

    const documentAttached = this.buildDocumentAttachments(originalDocuments, currentDocuments);

    return {
      taskId: task.taskId,
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority.toUpperCase(),
      parentTaskId: task.parentTaskId || 0,
      dueDate: TaskUtils.formatDate(formValue.dueDate),
      assignTo: assignTo,
      assignToUserType: assignToUserType,
      documentRequired: formValue.documentRequired || false,
      documentAttached: documentAttached,
      notificationData: notificationData?.notificationData || null
    };
  }


  private getOriginalDocuments(task: RequestTask): string[] {
    const documents: string[] = [];

    if (task.documentAttached && Array.isArray(task.documentAttached)) {
      task.documentAttached.forEach((doc: any) => {
        if (typeof doc === 'string') {
          documents.push(doc);
        } else if (doc && typeof doc === 'object') {
          const url = doc.documentUrl || doc.filePath || doc.url;
          if (url) documents.push(url);
        }
      });
    }

    if (task.documentUploaded && Array.isArray(task.documentUploaded)) {
      task.documentUploaded.forEach((doc: any) => {
        if (typeof doc === 'string') {
          documents.push(doc);
        } else if (doc && typeof doc === 'object') {
          const url = doc.documentUrl || doc.filePath || doc.url;
          if (url) documents.push(url);
        }
      });
    }

    if (task.documents && Array.isArray(task.documents)) {
      documents.push(...task.documents);
    }

    return [...new Set(documents)];
  }


  private buildDocumentAttachments(
    originalDocuments: string[],
    currentDocuments: string[]
  ): Array<{ documentUrl: string; status: 'ADDED' | 'DELETED' | '' }> {
    const documentAttachments: Array<{ documentUrl: string; status: 'ADDED' | 'DELETED' | '' }> = [];

    currentDocuments.forEach(doc => {
      if (!originalDocuments.includes(doc)) {
        documentAttachments.push({ documentUrl: doc, status: 'ADDED' });
      } else {
        documentAttachments.push({ documentUrl: doc, status: '' });
      }
    });

    originalDocuments.forEach(doc => {
      if (!currentDocuments.includes(doc)) {
        documentAttachments.push({ documentUrl: doc, status: 'DELETED' });
      }
    });

    return documentAttachments;
  }
  private async submitDataSubjectTask(
    requestRid: number,
    form: FormGroup,
    componentStage?: string,
    requestService?: RequestManagementService,
    notificationData?: any
  ): Promise<void> {
    const formValue: TaskFormData = form.getRawValue();
    const formUserId = this.taskStateService.getFormUserId();

    if (!formUserId) {
      throw new Error('DSR form user ID not available for data subject task creation');
    }

    const taskData: CreateDataSubjectTaskRequest & { notificationData?: any } = {
      dsrStage: '',
      title: formValue.title,
      description: formValue.description,
      documentRequired: formValue.documentRequired,
      priority: formValue.priority.toLowerCase(),
      formUserId: formUserId,
      dueDate: TaskUtils.formatDate(formValue.dueDate),
      notificationData: notificationData?.notificationData || null
    };

    return new Promise((resolve, reject) => {
      this.taskApiService.createDataSubjectTask(requestRid, taskData, componentStage, requestService).subscribe({
        next: () => {
          this.taskStateService.setSubmitLoading(false);
          this.snackbarService.openSnack('Data subject task created successfully');
          resolve();
        },
        error: (error) => {
          console.error('Data subject task creation failed:', error);
          this.taskStateService.setSubmitLoading(false);
          this.snackbarService.openSnack('Failed to create data subject task');
          reject(error);
        }
      });
    });
  }

  private async submitExternalUserTask(
    dialogType: DialogType,
    requestRid: number,
    parentTaskId: number,
    form: FormGroup,
    existingTask?: RequestTask,
    componentStage?: string,
    requestService?: RequestManagementService,
    notificationData?: any
  ): Promise<void> {
    const externalUser = this.taskStateService.externalUser();

    if (!externalUser?.applicationUserId) {
      throw new Error('External user information not available');
    }

    const formData = await this.prepareExternalUserFormData(form, externalUser.applicationUserId, notificationData);
    if (!formData) {
      this.taskStateService.setSubmitLoading(false);
      return;
    }

    const operation$ = this.getSubmitOperation(
      dialogType,
      requestRid,
      parentTaskId,
      formData,
      existingTask,
      componentStage,
      requestService
    );

    return new Promise((resolve, reject) => {
      operation$.subscribe({
        next: () => {
          this.taskStateService.setSubmitLoading(false);
          this.snackbarService.openSnack(
            existingTask ? 'External user task updated successfully' : 'External user task created successfully'
          );
          resolve();
        },
        error: (error) => {
          console.error('External user task operation failed:', error);
          this.taskStateService.setSubmitLoading(false);
          this.snackbarService.openSnack('Failed to save external user task');
          reject(error);
        }
      });
    });
  }

  private async submitApplicationUserTask(
    dialogType: DialogType,
    requestRid: number,
    parentTaskId: number,
    form: FormGroup,
    existingTask?: RequestTask,
    componentStage?: string,
    requestService?: RequestManagementService,
    notificationData?: any
  ): Promise<void> {
    const formData = await this.prepareFormData(form, notificationData);
    if (!formData) {
      this.taskStateService.setSubmitLoading(false);
      return;
    }

    const operation$ = this.getSubmitOperation(
      dialogType,
      requestRid,
      parentTaskId,
      formData,
      existingTask,
      componentStage,
      requestService
    );

    return new Promise((resolve, reject) => {
      operation$.subscribe({
        next: () => {
          this.taskStateService.setSubmitLoading(false);
          this.snackbarService.openSnack(
            existingTask ? 'Task updated successfully' : 'Task created successfully'
          );
          resolve();
        },
        error: (error) => {
          console.error('Task operation failed:', error);
          this.taskStateService.setSubmitLoading(false);
          this.snackbarService.openSnack('Failed to save task');
          reject(error);
        }
      });
    });
  }


  private getSubmitOperation(
    dialogType: DialogType,
    requestRid: number,
    parentTaskId: number,
    formData: CreateTaskRequest,
    existingTask?: RequestTask,
    componentStage?: string,
    requestService?: RequestManagementService
  ): Observable<any> {
    switch (dialogType) {
      case RequestDialogTypes.DATA_FULFILLMENT_TASK:
        return existingTask
          ? this.taskApiService.updateDataFulfillmentTask(requestRid, existingTask.taskId, {
            ...formData,
            taskId: existingTask.taskId,
            parentTaskId: existingTask.parentTaskId || 0,
            assignToUserType: this.getAssignToUserType(),
            documentRequired: this.getDocumentRequired(),
            documentAttached: formData.documentAttached.map(url => ({
              documentUrl: url,
              status: 'ADDED' as const
            }))
          } as UpdateTaskRequest)
          : this.taskApiService.createDataFulfillmentTask(requestRid, formData, requestService, componentStage);

      case RequestDialogTypes.TASK_MANAGEMENT_TASK:
        return existingTask
          ? this.taskApiService.updateSubTask(parentTaskId, existingTask.taskId, {
            ...formData,
            taskId: existingTask.taskId,
            parentTaskId: parentTaskId,
            assignToUserType: this.getAssignToUserType(),
            documentRequired: this.getDocumentRequired(),
            documentAttached: formData.documentAttached.map(url => ({
              documentUrl: url,
              status: 'ADDED' as const
            }))
          } as UpdateTaskRequest)
          : this.taskApiService.createSubTask(parentTaskId, formData, requestService, componentStage);

      default:
        throw new Error(`Unknown dialog type: ${dialogType}`);
    }
  }

  private getAssignToUserType(): string {
    const assigneeType = this.taskStateService.selectedAssigneeType();

    switch (assigneeType) {
      case 'APPLICATION_USER':
        return 'INTERNAL_USER';
      case 'DATA_SUBJECT':
        return 'DATA_SUBJECT';
      case 'EXTERNAL_USER':
        return 'EXTERNAL_USER';
      default:
        return 'INTERNAL_USER';
    }
  }

  private getDocumentRequired(): boolean {
    return !this.taskStateService.isDataRequestSelected();
  }



  private isTaskFormDialog(dialogType: DialogType): boolean {
    return dialogType === RequestDialogTypes.DATA_FULFILLMENT_TASK ||
      dialogType === RequestDialogTypes.TASK_MANAGEMENT_TASK;
  }

  private async loadUserMasterList(userTypes?: string[]): Promise<void> {
    try {
      const users: User[] = await this.userService.getAllUserMasterList(false, userTypes);
      this.taskStateService.setUserMasterList(users);
    } catch (error) {
      console.error('Failed to load user list:', error);
      this.snackbarService.openSnack('Failed to load user list');
    }
  }

  validateForm(form: FormGroup, effectiveAssigneeType?: string): boolean {
    const errors: ValidationError[] = [];
    const basicFields = ['title', 'description', 'dueDate', 'priority'];
    basicFields.forEach(key => {
      const control = form.get(key);
      if (control?.errors && control.touched) {
        const errorMessage = TaskValidators.getFieldErrorMessage(key, control.errors);
        errors.push({ field: key, message: errorMessage });
      }
    });

    if (this.taskStateService.hasDocumentsUploading()) {
      this.snackbarService.openSnack('Please wait for document uploads to complete');
      return false;
    }

    const assigneeType = effectiveAssigneeType || form.get('assigneeType')?.value;

    if (!assigneeType) {
      errors.push({ field: 'assigneeType', message: 'Please select an assignee type' });
    } else {
      if (assigneeType === 'DATA_SUBJECT') {
        const assigneeId = form.get('assignee')?.value;
        if (!assigneeId) {
          const dataSubjectOptions = this.getDataRequestOptions();
          if (dataSubjectOptions.length > 0) {
            form.patchValue({ assignee: dataSubjectOptions[0].value });
          } else {
            errors.push({ field: 'assignee', message: 'Data subject information not available' });
          }
        }
      } else if (assigneeType === 'INTERNAL') {
        const assigneeId = form.get('assignee')?.value;
        if (!assigneeId) {
          errors.push({ field: 'assignee', message: 'Please select an internal user' });
        } else {
          const userList = this.taskStateService.userMasterList();
          const validUser = userList.find(user => user.applicationUserId.toString() === assigneeId?.toString());
          if (!validUser) {
            errors.push({ field: 'assignee', message: 'Invalid user selection' });
          }
        }
      } else if (assigneeType === 'EXTERNAL') {
        const externalUser = this.taskStateService.externalUser();
        if (!externalUser?.applicationUserId) {
          errors.push({ field: 'externalEmail', message: 'Please process external user email first' });
        }
      }
    }

    this.taskStateService.setFormErrors(errors);

    if (errors.length > 0) {
      this.snackbarService.openSnack('Please fix form errors before submitting');
      return false;
    }

    return true;
  }

  onAssigneeTypeChange(assigneeType: AssigneeType | ''): void {
    this.taskStateService.setSelectedAssigneeType(assigneeType);
  }

  onSubAssigneeChange(subAssigneeId: string | number | ''): void {
    this.taskStateService.setSelectedSubAssignee(subAssigneeId);
  }

  getAssigneeSelection(): AssigneeSelection {
    return this.taskStateService.getAssigneeSelection();
  }

  getDsrRequestedUser(): DsrFormRequestedUserDetails | null {
    return this.taskStateService.dsrFormRequestedUser();
  }

  getDataRequestOptions(): Array<{ value: string, label: string }> {
    const dsrUser = this.taskStateService.dsrFormRequestedUser();
    if (!dsrUser) return [];

    return [{
      value: dsrUser.pid,
      label: `${dsrUser.pid} (${dsrUser.pidType})`
    }];
  }

  async loadDataFulfillmentRecords(requestRid: number, taskId: number): Promise<void> {
    try {
      const response = await this.taskApiService.getDataFulfillmentRecords(requestRid, taskId);
      if (response?.recordList) {
        this.taskStateService.setDataFulfillmentRecords(response.recordList);
      }
    } catch (error) {
      console.error('Failed to load data fulfillment records:', error);
      this.snackbarService.openSnack('Failed to load data fulfillment records');
    }
  }

  resetState(): void {
    this.taskStateService.reset();
  }
}
