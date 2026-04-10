import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { DSR_DOCUMENT_UPLOAD, GLOBAL_DIALOG_DEFAULTS, NAVIGATION_TYPE, DSR_FIELD_DISPLAY_KEYS } from '@admin-core/constants/constants';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileDropDirective } from '@valura-lib/directives/file-drop/file-drop.directive';
import { TextFieldModule } from '@angular/cdk/text-field';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { RequestDialogTypes, RequestStageTab, RequestThrough } from '../../request-management/constant';
import { documentAttached, DocumentUpload, SelectedFile, TaskDetails, TaskId, TaskResolution } from '@admin-core/models/task-management/RequestTask';
import { formatStatus, statusColors } from '../../request-management/request-utils';
import { TaskManagementService } from '@admin-core/services/task-management/task-management.service';
import { FIRST_PAGE, HEADER_DATE, HEADER_ID, HEADER_NOTE, HEADER_SELECT, PAGE_SIZE, TASK_MANAGEMENT_DOCUMENT_UPLOAD_HEADER, TaskDisplayStatusAction, TaskStatusActionApiMap } from '../constant';
import { MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';
import { setItem } from '@valura-lib/utils/local-storage-util';
import { ActivityStepperDialogComponent } from '../../request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
import { AUDIT_LOG_MODULE, AUDIT_LOG_ENTITY_TYPE } from '@admin-core/constants/constants';
import { AuthService } from '@admin-core/services/auth.service';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { validateImageFile, FILE_UPLOAD_ACCEPT, FILE_UPLOAD_SUPPORTED_TEXT } from '@admin-core/constants/file-upload.constants';
import { formatPriority, formatEffortLevel, TASK_DETAIL_TAB_HEADERS, TaskDetailsKey } from '../task-utils';
import { MatSelectModule } from "@angular/material/select";
import { MatTabGroup, MatTabsModule } from "@angular/material/tabs";
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { CreateTaskDrawerComponent } from '../../request-management/request-management-details/request-details-stages/create-task-drawer/create-task-drawer.component';
import { TaskActivityLogComponent } from '../task-activity-log/task-activity-log.component';
import { DiscussionLogComponent } from './discussion-log/discussion-log.component';
import { MessageListComponent } from './message-list/message-list.component';
import { DiscussionLogService } from './discussion-log.service';
import { RequestDocuments } from '@admin-core/models/request-management/DsrRequest';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { EllipsisTooltipDirective } from '@valura-lib//directives/ellipsis-tooltip.directive';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { ViewTypeDialogComponent } from '@admin-page/request-management/request-management-dialog/view-type-dialog/view-type-dialog.component';
import { ROUTE_BACK } from '@admin-core/constants/local-storage-constants';

interface HighlightMessageData {
  messageId: number;
  parentId: number | null;
  pageNumber: number;
  totalPages: number;
}
const { TASK_MANAGEMENT_LIST, TASK_MANAGEMENT, USER, DSRR, REQUEST_MANAGEMENT, REQUEST_MANAGEMENT_DETAILS } = routeConstants;
@Component({
  selector: 'task-details',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule, MatSortModule,
    MatInputModule, MatCheckboxModule, MatTooltipModule, FileDropDirective, TextFieldModule, MatSelectModule, MatTabGroup, MatTabsModule,
    MatSidenavModule, CreateTaskDrawerComponent, DiscussionLogComponent, MessageListComponent, TaskActivityLogComponent, LoadingButtonComponent,
    EllipsisTooltipDirective, ErrorLoadingItemsComponent],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss'
})
export class TaskDetailsComponent implements OnInit {
  @Input() requestTask: boolean = false
  @ViewChild('editTaskDrawer') editTaskDrawer!: MatSidenav;
  @ViewChild(CreateTaskDrawerComponent) createTaskDrawerComponent!: CreateTaskDrawerComponent;
  @ViewChild('messageListComponent') messageListComponent!: MessageListComponent;

  taskDetails: TaskDetails | null = null;
  loading: boolean = false;
  taskId!: number;
  isUploading: boolean = false;
  highlightMessageData: HighlightMessageData | null = null;
  editTaskData: any = null;
  isEditTaskMode: boolean = false;
  taskDrawerDocumentsList: any[] = [];
  taskDrawerRequestStage: string = '';
  submitting: boolean = false;
  isCardExpanded: boolean = false;
  HEADER_NOTE = undefined;
  selection = new SelectionModel<DocumentUpload>(true, []);
  showUploadArea: boolean = false;
  documentName: string = '';
  remark: string = '';
  selectedFiles: SelectedFile[] = [];
  actionCliked: string = '';
  reopenRemark: string = '';
  tableHeaders: any = [];
  displayedHeaders = [];
  HEADER_DATE = HEADER_DATE
  HEADER_SELECT = HEADER_SELECT
  HEADER_ID = HEADER_ID
  requestRid: number = 0;
  dsrRequestDetails: any = null;
  showBackButton: boolean = false
  showActivity: boolean = false;
  selectedTabIndex = 0;
  selectedTab: string = TaskDetailsKey.DETAILS;
  TaskDetailsKey = TaskDetailsKey
  totalPages = 0;
  shimmerData = {
    taskId: '',
    title: '',
    status: '',
    dueDate: '',
    taskType: '',
    priority: '',
    description: '',
    assignToUserName: ''
  };
  currentTaskName: string = '';
  pageSize: number = PAGE_SIZE
  isDocLoading = false;
  pageNo: number = FIRST_PAGE
  verifyButtonLabel: string = '';
  reOpenButtonLabel: string = '';
  completeButtonLabel: string = '';
  documentUpload: DocumentUpload[] = [];
  taskResolution: TaskResolution[] = [];
  requestDocuments!: RequestDocuments[]
  taskType: string = '';
  questionDetails: any = null;
  measureDetails: any = null;
  loadingMetaData: boolean = false;
  highLightdMessageId = 0
  tabHeaderDetails = TASK_DETAIL_TAB_HEADERS;
  readonly fileUploadAccept = FILE_UPLOAD_ACCEPT;
  readonly fileUploadSupportedText = FILE_UPLOAD_SUPPORTED_TEXT;

  selectedAction: string = '';
  actionsList = [
    { value: TaskDisplayStatusAction.HOLD, label: 'On hold' },
    { value: TaskDisplayStatusAction.CLOSE, label: 'Close task' },
    { value: TaskDisplayStatusAction.SEND_BACK, label: 'Send back' }
  ];
  actionOptions = this.actionsList
  disableActionButton: boolean = false;
  emailNavigation: boolean = false;

  private discussionService = inject(DiscussionLogService);

  private location = inject(Location);
  private authService = inject(AuthService);
  private router = inject(Router);
  currentRequestDetails = {
    vendorId: 0,
    index: 0,
  };
  private navigationDirection: 'prev' | 'next' | null = null;
  currentPath: any;
  hasApiError: boolean = false;
  bpaIds: number[] = [];
  currentIndex: number = 0;
  isCollectionPointNavigation: boolean = false;
  fromRequestDetails: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiHelperService: ApiHelperService,
    private httpService: HttpService,
    private snackbarService: SnackbarService,
    private taskManagementService: TaskManagementService,
    public dialog: MatDialog,) { }

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      const taskType = params['type'];
      const key = params['key'];  // To decide navigation from email

      const tabKey = params['tab'];
      // const tabKey = "DISCUSSION_LOG";

      const messageId = params['id'] ? +params['id'] : null;
      if (messageId) {
        this.highLightdMessageId = messageId
      }
      this.highlightMessageData = {
        messageId: this.highLightdMessageId,
        parentId: null,
        pageNumber: 1,
        totalPages: 1
      };

      if (tabKey) {
        const tabIndex = this.getTabIndexByKey(tabKey);

        if (tabIndex !== -1) {
          this.selectedTabIndex = tabIndex;
          this.selectedTab = tabKey;
        }
      }
      if (taskType) {
        this.taskType = taskType
      }
      if (key) {
        this.emailNavigation = true
      }
    })
    // this.taskId = this.route.snapshot.params['taskRid'];
    // this.requestRid = this.taskId; // Keep this

    this.route.paramMap.subscribe(async params => {
      let id = params.get('taskRid');
      this.taskId = id ? +(id) : 0;
      const requestList = this.taskManagementService.getTaskRid();
      const current = requestList?.find((r: TaskId) => r.id === this.taskId);
      this.currentTaskName = current?.name || '';
      this.onInitPage();

      this.discussionService.setTaskId(this.taskId);
      this.setTableInfo()
      if (this.taskId) {
        await this.loadTaskDetails();
        // getDocumentsList()
      }
    });
    const navState = history.state;
    if (navState?.fromCollectionPoint) {
      this.showBackButton = true;
      this.isCollectionPointNavigation = true;
      this.fromRequestDetails = true;

      this.bpaIds = navState.bpaIds || [];
      this.currentIndex = navState.currentIndex ?? 0;
    }
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.updateCurrentRequestIndex()
  }

  private getTabIndexByKey(key: string): number {
    return this.tabHeaderDetails.findIndex(tab => tab.key === key);
  }



  onMessageItemClick(event: { type: any, id: number, data: any }): void {
    const discussionLogTabIndex = this.tabHeaderDetails.findIndex(
      tab => tab.key === TaskDetailsKey.DISCUSSION_LOG
    );

    if (discussionLogTabIndex !== -1) {
      this.selectedTabIndex = discussionLogTabIndex;
      this.highlightMessageData = {
        messageId: event.id,
        parentId: event.data?.parentId || null,
        pageNumber: event.data?.pageNumber || 1,
        totalPages: event.data?.totalPages || 1
      };


      setTimeout(() => {
        this.highlightMessageData = null;
      }, 3000);
    }
  }

  openAttachmentUpload(): void {
    if (this.messageListComponent) {
      this.messageListComponent.openAttachmentUpload();
    }
  }

  onTabChange(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.key;
    const prevIndex = (index - 1);
    const prevTabKey = this.tabHeaderDetails[prevIndex]?.key;

    this.selectedTab = tabKey;
  }

  getPriority(priority: string): string {
    return formatPriority(priority);
  }

  getEffortLevel(effortLevel: string): string {
    return formatEffortLevel(effortLevel);
  }

  async setTableInfo() {
    this.tableHeaders = TASK_MANAGEMENT_DOCUMENT_UPLOAD_HEADER
    if (this.tableHeaders?.length) {
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
    }
  }

  private async loadTaskDetails(): Promise<void> {
    this.loading = true;
    this.hasApiError = false;
    this.clearPreviousData()
    try {
      const taskData = await this.apiHelperService.getTaskDetails(+(this.taskId));
      if (taskData?.success == false || !taskData) { this.hasApiError = true; return }
      if (taskData) {
        this.taskDetails = await this.taskManagementService.processTaskDetails(taskData);
        this.requestRid = (this.taskDetails?.dsrDetail?.id ?? 0);

        if (this.requestRid) {
          // await this.getDocumentsList();


          if (this.taskDetails?.dsrDetail?.dsrFormUserDetails || (taskData as any)?.dsrFieldDisplayKeys) {
            this.dsrRequestDetails = {
              dsrFormRequestedUserDetails: this.taskDetails.dsrDetail?.dsrFormUserDetails || null,
              dsrFieldDisplayKeys: (taskData as any)?.dsrFieldDisplayKeys || [],
              dsrDetails: this.taskDetails.dsrDetail
            };
          } else {
            this.dsrRequestDetails = null;
          }
        }

        this.setTaskResoultionData()
        // this.setActionButtonLabels();
        this.setBackButtonState();
        await this.loadTaskMetaDetails();
        this.setupActionOptions()
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      this.snackbarService.openSnack('Failed to load task details');
      this.hasApiError = true;
    } finally {
      this.loading = false;
      this.disableActionButton = false;
    }
  }

  clearPreviousData() {
    this.taskDetails = null;
    this.dsrRequestDetails = null;
    this.questionDetails = null;
    this.measureDetails = null;
    this.taskResolution = [];
    this.documentUpload = [];
  }

  setupActionOptions() {
    if (this.isAssigned) {
      if (this.taskOpen || this.requestTaskInProgress || this.requestTaskReopened) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.SUBMIT_FOR_REVIEW, label: 'Send' }
        ];
      }
      else {
        this.actionOptions = []
      }
    }
    else if (!this.isAssigned) {
      if (this.taskOpen || this.requestTaskInProgress || this.requestTaskReopened) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.CLOSE, label: 'Close task' },
          { value: TaskDisplayStatusAction.HOLD, label: 'On hold' },
        ];
      }
      else if (this.requestTaskSendForReview) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.CLOSE, label: 'Close task' },
          { value: TaskDisplayStatusAction.HOLD, label: 'On hold' },
        ];
      }
      else if (this.requestTaskOnHold) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.RESUME_TASK, label: 'Resume task' },
          { value: TaskDisplayStatusAction.CLOSE, label: 'Close task' },
          // { value: TaskDisplayStatusAction.SEND_BACK, label: 'Send back' }
        ]
      }
      else if (this.requestTaskClosed) {
        this.actionOptions = [
          { value: TaskDisplayStatusAction.REOPEN, label: 'Re-open Task' }
        ]
      }
      else {
        this.actionOptions = []
      }
    }

  }

  // async getDocumentsList(pageNo: number = this.pageNo) {
  //   if (!this.requestRid) {
  //     console.warn('loadRequestDocuments: No requestRid available');
  //     return;
  //   }
  //   let params = { page: pageNo, size: this.pageSize };

  //   try {
  //     const data = await this.apiHelperService.getDocumentList(this.requestRid, params);

  //     if (data) {
  //       if (pageNo === FIRST_PAGE) {
  //         this.requestDocuments = data.documents ?? [];

  //       } else {
  //         this.requestDocuments = [...this.requestDocuments, ...(data.documents ?? [])];
  //         // const newDocuments = data.documents ? data.documents.map((doc: any) => ({
  //         //   id: doc.id.toString(),
  //         //   name: doc.name.split('/').pop() || doc.name,
  //         //   fullPath: doc.name
  //         // })) : [];
  //       }
  //       this.pageNo = pageNo;
  //       this.totalPages = data.totalPages;
  //     }
  //   }
  //   finally {
  //     // setTimeout(() => (this.isTabLoading = false), 300);
  //   }
  // }

  async viewRequestDocument(document: RequestDocuments) {
    if (document.loading) {
      return
    }
    document.loading = true
    await this.viewDocument(document.documentUrl, document.documentName);
    document.loading = false
  }



  private async loadTaskMetaDetails(): Promise<void> {
    if (!this.taskDetails?.taskMeta?.type || !this.taskDetails?.taskMeta?.id) {

      return;
    }

    const metaType = this.taskDetails.taskMeta.type;
    const metaId = this.taskDetails.taskMeta.id;

    this.loadingMetaData = true;

    try {
      if (metaType === 'QUESTION') {

        const response = await this.apiHelperService.getQuestionDetails(metaId);
        if (response && response.question) {
          this.questionDetails = response.question;

        } else {
          console.warn('Failed to load question details or invalid response structure:', response);

        }
      }
      else if (metaType === 'MITIGATION') {
        const response = await this.apiHelperService.getMeasureDetails(metaId);

        if (response && response.measure) {
          this.measureDetails = response.measure;

        } else {
          console.warn('Invalid measure details response:', response);
        }
      }
      else {
        console.warn(`Unknown taskMeta type: ${metaType}`);
      }
    } catch (error) {
      console.error('Error loading task meta details:', error);

    } finally {
      this.loadingMetaData = false;
    }
  }
  getAssociatedFiles(associatedFilesString: string): any[] {
    if (!associatedFilesString) return [];

    try {
      return JSON.parse(associatedFilesString);
    } catch (error) {
      console.error('Error parsing associated files:', error);
      return [];
    }
  }

  get parsedQuestionFiles(): any[] {
    if (!this.questionDetails?.responseDetails?.[0]?.associatedFiles) {
      return [];
    }
    return this.getAssociatedFiles(this.questionDetails.responseDetails[0].associatedFiles);
  }
  get parsedResponseFiles(): any[] {
    if (!this.questionDetails?.responseDetails?.[0]?.response) {
      return [];
    }
    return this.getAssociatedFiles(this.questionDetails.responseDetails[0].response);
  }

  get isFileUploadQuestion(): boolean {
    return this.questionDetails?.type === 'FILE_UPLOAD';
  }

  get hasQuestionDetails(): boolean {
    return !!this.questionDetails;

  }

  get hasMeasureDetails(): boolean {
    return !!this.measureDetails;
  }

  get isQuestionTask(): boolean {
    return this.taskDetails?.taskMeta?.type === 'QUESTION';
  }

  get isMitigationTask(): boolean {
    return this.taskDetails?.taskMeta?.type === 'MITIGATION';
  }



  get hasRemarks(): boolean {
    return this.taskResolution?.some(doc => doc.remarks && doc.remarks.trim() !== '') ?? false;
  }

  formatDate(dateString?: string): string {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleDateString('en-GB');
  }


  toggleUploadView(): void {
    this.showUploadArea = true;
  }

  hideUploadView(): void {
    this.showUploadArea = false;
  }

  goBack(): void {
    if (this.requestTask) {
      setItem(ROUTE_BACK, RequestStageTab.TASKS)
    }
    if (this.isInternalOrExternalUser || this.emailNavigation) {
      this.router.navigate([`${USER}/${DSRR}/${TASK_MANAGEMENT}/${TASK_MANAGEMENT_LIST}`])
      return
    }
    this.location.back();
  }

  onFileSelected(file: File): void {
    this.selectedFiles.push({ file: file, remark: '' });
  }

  onclick(event: any) {
    event.target.value = ''
  }

  onFileDropped(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      this.onFileChange(fileList[i]);
    }
  }

  onFileBrowse(event: any) {
    if (event.target.files && event.target.files.length) {
      for (let i = 0; i < event.target.files.length; i++) {
        this.onFileChange(event.target.files[i]);
      }
    }
  }

  toggleCardExpanded(): void {
    this.isCardExpanded = !this.isCardExpanded;
  }

  onFileChange(file: File) {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      this.snackbarService.openSnack(validation.errorMessage || 'Invalid file');
      return;
    }
    this.onFileSelected(file);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  async onCompleteTask(): Promise<void> {
    if (!this.taskDetails) return;

    this.submitting = true;
    try {
      const uploadedDocuments = [];
      for (const selectedFile of this.selectedFiles) {
        try {
          const uploadedAttachment = await this.uploadPresignedUrl(selectedFile.file);

          if (uploadedAttachment) {
            uploadedDocuments.push({ ...uploadedAttachment, remark: selectedFile.remark });
          }
        } catch (error) {
          console.error(`Error uploading file ${selectedFile.file.name}:`, error);
          this.snackbarService.openSnack(`Failed to upload ${selectedFile.file.name}`);
          this.submitting = false;
        }
      }

      const documents = uploadedDocuments.map(doc => ({
        fileKey: doc.fileKey,
        remark: doc.remark
      }));

      // this.completeTask(documents, this.remark);
      // const result = await this.completeTask(documents, this.remark);
      // if (result) {
      //   this.snackbarService.openSnack('Task completed successfully');
      //   this.selectedFiles = [];
      //   this.remark = '';
      //   this.showUploadArea = false;

      //   await this.loadTaskDetails();
      // }
    } catch (error) {
      console.error('Error completing task:', error);
      this.snackbarService.openSnack('Failed to complete task');
    } finally {
      this.submitting = false;
    }
  }

  private extractServerPathFromPresignedUrl(presignedUrl: string): string {
    try {
      const url = new URL(presignedUrl);

      return `${url.origin}${url.pathname}`;
    } catch (error) {
      console.error('Error extracting server path from presigned URL:', error);
      return '';
    }
  }

  async uploadPresignedUrl(file: File): Promise<any> {
    const params = {
      fileName: file.name,
      contentType: file.type,
      purpose: DSR_DOCUMENT_UPLOAD
    };

    try {
      const imageInfo: any = await this.apiHelperService.uploadPresignedUrl(params);
      if (imageInfo) {
        const uploadResult = await this.getImageEtag(imageInfo.presignedUrl, file);
        if (uploadResult) {
          const serverPath = this.extractServerPathFromPresignedUrl(imageInfo.presignedUrl);
          return {
            fileKey: imageInfo.fileKey,
            eTag: uploadResult.headers?.get('ETag') || uploadResult.headers?.get('etag'),
            serverPath: serverPath,
            fileName: file.name,
            fileSize: file.size,
            presignedUrl: imageInfo.presignedUrl
          };
        }
      }
      throw new Error('Failed to get presigned URL');
    } catch (error) {
      console.error('Error in uploadPresignedUrl:', error);
      throw error;
    }
  }

  async getImageEtag(presignedUrl: string, file: File): Promise<any> {
    try {
      let res: any = await this.apiHelperService.getImageEtag(presignedUrl, file);
      if (res && this.httpService.isHttpSuccess(res?.status)) {
        return res
      }
      return null;
    } catch (error) {
      console.error('Error in getImageEtag:', error);
      throw error;
    }
  }

  onCloseTaskActionFromAssignor() {
    this.actionCliked = ''
    const action = TaskStatusActionApiMap[TaskDisplayStatusAction.CLOSE]
    this.onTaskAction(action);
  }

  onTaskActionForRespondent() {
    const action = TaskStatusActionApiMap[TaskDisplayStatusAction.SUBMIT_FOR_REVIEW];
    this.onCloseTask(action)
  }

  onCloseTask(taskAction: string) {
    const taskId = +(this.taskId);
    const payload = {
      "documents": [],
      "comments": ""
    };
    this.submitting = true;
    this.apiHelperService.onTaskActionForRespondent(payload, (taskId ?? 0), taskAction)
      .subscribe({
        next: async (res) => {
          this.loadTaskDetails();
          this.submitting = false;
          this.actionCliked = ''
          this.hideUploadView()
        },
        error: (e: Error) => {
          console.error(e.message);
          this.submitting = false
        },
      });
  }

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        entityId: this.taskId,
        audit_log_module: AUDIT_LOG_MODULE.TASK_MANAGEMENT,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.TASK
      }
    });
  }

  editAssignee(): void {
  }

  isUploadDisabled(): boolean {
    return this.selectedFiles.length === 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  get showAddDocument() {
    return (this.isAssigned && !this.taskCompleted)
  }

  onResumeTask() {
    this.actionCliked = ''
    const action = TaskStatusActionApiMap[TaskDisplayStatusAction.RESUME_TASK]
    this.onTaskAction(action);
  }

  onTaskAction(action: string) {
    if (this.submitting) {
      return
    }
    this.actionCliked = action
    this.submitting = true;
    const body = {
      remarks: this.reopenRemark.trim()
    }
    this.apiHelperService.onTaskAction(+(this.taskId), action, body)
      .subscribe({
        next: async (res) => {
          this.loadTaskDetails();
          this.submitting = false;
          this.actionCliked = ''
          this.hideUploadView()
        },
        error: (e: Error) => {
          console.error(e.message);
          this.submitting = false;
          this.actionCliked = ''
        },
      });
  }

  get addButtonLabel() {
    return !this.isAssigned ? '' : this.taskCompleted ? '' : 'Add document'
  }

  getStatusColors(status: string): string {
    return statusColors(status)
  }

  getStatusText(status: string): string {
    return formatStatus(status)
  }

  // get verifyLoading(): boolean {
  //   return (this.actionCliked == RequestTaskAction.VERIFY && this.submitting)
  // }

  // get resolveLoading(): boolean {
  //   return (this.actionCliked == RequestTaskAction.RESOLVE_TASK && this.submitting)
  // }

  // get reopenLoading(): boolean {
  //   return (this.actionCliked == RequestTaskAction.REOPEN && this.submitting)
  // }

  // get submitLoading(): boolean {
  //   return (!this.isAssigned ? (this.verifyLoading) : this.submitting)
  // }

  get showActionButton() {
    // if (!this.isAssigned) {
    //   return (this.requestTaskClosed || this.taskReopen) ? false : true
    // }
    return !(this.taskCompleted)
  }


  get taskOpen(): boolean {
    return (this.taskManagementService.requestTaskOpen((this.taskDetails?.state ?? '')))
  }

  get requestTaskReopened(): boolean {
    return (this.taskManagementService.requestTaskReopened((this.taskDetails?.state ?? '')))
  }

  get requestTaskInProgress(): boolean {
    return (this.taskManagementService.requestTaskInProgress((this.taskDetails?.state ?? '')))
  }

  get requestTaskClosed(): boolean {
    return (this.taskManagementService.requestTaskClosed((this.taskDetails?.state ?? '')))
  }

  get requestTaskOnHold(): boolean {
    return (this.taskManagementService.requestTaskOnHold((this.taskDetails?.state ?? '')))
  }

  get requestTaskSendForReview(): boolean {
    return (this.taskManagementService.requestTaskSendForReview((this.taskDetails?.state ?? '')))
  }

  get taskCompleted(): boolean {
    return (this.taskDetails?.isCompleted ?? false)
  }

  onDocNameClick(doc: DocumentUpload) {
    if (!doc?.fileKey) {
      console.error("No fileKey found for document", doc);
      return;
    }
    this.viewDocument(doc.fileKey, doc.fileKey);
  }

  onDocLinkClick(doc: documentAttached) {
    if (!doc?.documentUrl) {
      console.error("No fileKey found for document", doc);
      return;
    }
    let docName = this.getFileName(doc.documentUrl)
    this.viewDocument(doc.documentUrl, docName);
  }

  async viewDocument(file: any, fileName?: string) {
    // Extract fileKey - handle both string and object inputs
    let fileKey: string;

    if (typeof file === 'string') {
      fileKey = file;
    } else if (file && typeof file === 'object') {
      // Handle object with fileKey or link property
      fileKey = file.fileKey || file.link || file.documentUrl || '';
    } else {
      console.error('Invalid file parameter:', file);
      this.snackbarService.openSnack('Unable to open document: Invalid file reference');
      return;
    }

    if (!fileKey) {
      console.error('No fileKey found in file parameter:', file);
      this.snackbarService.openSnack('Unable to open document: No file key found');
      return;
    }

    const params = {
      "fileKey": fileKey,
    };

    let actualFileName = fileName || this.getFileName(fileKey);

    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: actualFileName || '',
          requestRid: this.requestRid,
          isTaskView: true
        },
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        maxWidth: '100vh',
        disableClose: false,
        panelClass: 'dialog-wrapper',
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe(result => {
      });
    } else {
      console.error('Failed to get presigned URL');
    }
  }

  // onScroll(e: Event) {
  //   const el = e.target as HTMLElement;

  //   const threshold = 100;
  //   const position = el.scrollTop + el.clientHeight;
  //   const height = el.scrollHeight;

  //   const bottomReached = position >= height - threshold;

  //   if (
  //     bottomReached &&
  //     !this.isDocLoading &&
  //     this.pageNo < this.totalPages
  //   ) {
  //     this.isDocLoading = true;

  //     this.getDocumentsList(this.pageNo + 1)
  //       .finally(() => {
  //         this.isDocLoading = false;
  //       });
  //   }
  // }



  getFileName(fileKey: string): string {
    if (!fileKey || typeof fileKey !== 'string') return '';
    const fullName = fileKey.split('/').pop() || '';
    if (fullName.length <= 20) return fullName;

    const prefixLength = 10;
    const suffixLength = 10;
    const prefix = fullName.substring(0, prefixLength);
    const suffix = fullName.substring(fullName.length - suffixLength);
    return `${prefix}...${suffix}`;
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }

  setBackButtonState() {
    if (this.requestTask) {
      this.showBackButton = true
    }
  }

  get documentRequired(): boolean {
    return !!this.taskDetails?.documentRequired;
  }

  get isAssigned(): boolean {
    return !!this.taskDetails?.isAssigned;
  }

  setActionButtonLabels() {
    this.verifyButtonLabel = '';
    this.reOpenButtonLabel = '';
    this.completeButtonLabel = '';

    if (this.showActionButton) {
      if (!this.isAssigned) {
        this.completeButtonLabel = 'Resolve';
        if (this.taskCompleted) {
          this.reOpenButtonLabel = 'Reopen';
        }
      }
      if (this.isAssigned) {
        this.completeButtonLabel = 'Complete Task'
      }
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    try {
      let normalized = dateString;
      if (dateString.includes('T') && !/[Z+-]/.test(dateString)) {
        normalized = dateString + 'Z';
      }
      const date = new Date(normalized);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '-';
      }
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(/\//g, ' ');
    } catch (error) {
      console.error('Error formatting date time:', error);
      return dateString;
    }
  }

  setTaskResoultionData() {
    this.taskResolution = (this.taskDetails?.taskResolution ?? []);

    if (this.taskResolution.length > 0) {

    }
    this.documentUpload = this.taskDetails?.taskResolution?.flatMap(res =>
      (res.documentUploaded ?? []).map(doc => ({
        ...doc,
        formattedUploadedAt: this.formatDateTime(doc.uploadedAt)
      }))
    ) ?? [];

    if (this.documentUpload.length > 0) {
      const sampleDoc = this.documentUpload[0] as any;

    }
  }

  get showTaskDetails() {
    return this.taskResolution && this.taskResolution?.length
  }

  get hasDocumentData() {
    return (this.documentUpload?.length ?? 0);
  }

  async openEditTaskDrawer(): Promise<void> {
    if (!this.taskDetails) {
      this.snackbarService.openSnack('Task details not loaded');
      return;
    }

    // dsrRequestDetails is already set in loadTaskDetails with dsrFieldDisplayKeys
    // No need to set it again here

    this.editTaskData = {
      taskId: this.taskDetails.taskId,
      title: this.taskDetails.title,
      description: this.taskDetails.description,
      dueDate: this.taskDetails.dueDate,
      priority: this.taskDetails.priority,
      levelOfEffort: (this.taskDetails as any).levelOfEffort || null,
      assignToUserId: this.taskDetails.assignToUserId,
      assignToUserType: this.taskDetails.assignToUserType,
      assigneeToUserName: this.taskDetails.assignToUserName,
      parentTaskId: this.taskDetails.parentTaskId || 0,
      status: this.taskDetails.status,
      taskType: this.taskDetails.taskType,
      taskDetails: (this.taskDetails as any).taskDetails || {},
      documentRequired: this.taskDetails.documentRequired,
      taskLabelMappings: (this.taskDetails as any).taskLabelMappings || [],
      visibleFieldNames: (this.taskDetails as any).visibleFieldNames || [],
      documentAttached: (this.taskDetails as any).documentAttached || this.taskDetails.documentAttached || [],
      dsrDetail: this.taskDetails.dsrDetail || null,
    };

    this.isEditTaskMode = true;

    this.taskDrawerDocumentsList = this.requestDocuments;
    this.taskDrawerRequestStage = this.determineRequestStage();

    if (this.editTaskDrawer) {
      this.editTaskDrawer.open();
      setTimeout(() => {
        this.createTaskDrawerComponent?.onDrawerOpened();
      }, 0);
    }
  }



  get visibleDocuments(): RequestDocuments[] {
    if (!this.requestDocuments?.length || !this.taskDetails?.visibleFieldNames?.length) {
      return [];
    }

    const visibleSet = new Set(this.taskDetails.visibleFieldNames);

    return this.requestDocuments.filter(doc =>
      visibleSet.has(doc.name)
    );
  }

  private hasValidValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  private getFieldValueFromDsrDetails(fieldKey: string): any {
    const dsrDetail = this.taskDetails?.dsrDetail;
    if (!dsrDetail) return null;

    switch (fieldKey) {
      case 'ALL':
        return true;
      case 'DATA_SUBJECT_TYPE':
        return dsrDetail.dataSubjectType;
      case 'NAME':
        return dsrDetail.name;
      case 'RESIDENCY':
        return dsrDetail.country;
      case 'EMAIL':
        return dsrDetail.email;
      case 'PHONE_NUMBER':
        return dsrDetail.phoneNumber;
      case 'REQUEST_TYPE':
        return dsrDetail.requestType;
      case 'REQUEST_CHANNEL':
        return dsrDetail.channel;
      case 'THROUGH':
        return dsrDetail.through;
      case 'RAISED_ON':
        return dsrDetail.requestedOn;
      case 'EXPIRES_ON':
        return dsrDetail.expiresOn;
      case 'DESCRIPTION':
        return dsrDetail.description;
      case 'THIRD_PARTY_NAME':
        return dsrDetail.thirdPartyName;
      case 'THIRD_PARTY_ROLE':
        return dsrDetail.thirdPartyRole;
      case 'THIRD_PARTY_EMAIL':
        return dsrDetail.thirdPartyEmail;
      case 'THIRD_PARTY_PHONE_NO':
        return dsrDetail.thirdPartyPhoneNo;
      case 'ROLE':
        return dsrDetail.role;
      default:
        return null;
    }
  }

  shouldShowField(fieldKey: string): boolean {
    if (!this.taskDetails?.visibleFieldNames?.length) {
      return false;
    }

    const isVisible = this.taskDetails.visibleFieldNames.includes(fieldKey);
    if (!isVisible) {
      return false;
    }

    const value = this.getFieldValueFromDsrDetails(fieldKey);
    return this.hasValidValue(value);
  }

  get visibleDsrFields(): Array<{ key: string; label: string; value: any }> {
    if (!this.taskDetails?.visibleFieldNames?.length) {
      return [];
    }

    const dsrFieldKeys = DSR_FIELD_DISPLAY_KEYS;
    const visibleFields: Array<{ key: string; label: string; value: any }> = [];

    this.taskDetails.visibleFieldNames.forEach((fieldKey: string) => {
      const fieldDef = dsrFieldKeys.find(f => f.key === fieldKey);
      if (fieldDef) {
        const value = this.getFieldValueFromDsrDetails(fieldKey);
        if (this.hasValidValue(value)) {
          visibleFields.push({
            key: fieldKey,
            label: fieldDef.value,
            value: value
          });
        }
      }
    });

    return visibleFields;
  }

  getFieldDisplayValue(fieldKey: string, value: any): string {
    if (!this.hasValidValue(value)) {
      return 'N/A';
    }

    if (fieldKey === 'RAISED_ON' || fieldKey === 'EXPIRES_ON') {
      return this.formatDate(value) || 'N/A';
    }

    return value;
  }

  closeEditTaskDrawer(): void {
    this.editTaskData = null;
    this.isEditTaskMode = false;
    this.taskDrawerDocumentsList = [];

    if (this.editTaskDrawer) {
      this.editTaskDrawer.close();
    }
  }

  onSaveTask(event: any): void {

    this.closeEditTaskDrawer();

    this.loadTaskDetails();

    const message = event.taskUpdated ? 'Task updated successfully' : 'Task saved successfully';
    this.snackbarService.openSnack(message);
  }

  private determineRequestStage(): string {
    const stage = (this.taskDetails as any)?.stage || this.taskDetails?.state;
    if (stage) {
      return stage;
    }

    const taskType = this.taskDetails?.taskType;
    if (taskType) {
      const stageMapping: { [key: string]: string } = {
        'DSR_VERIFICATION_TASK': 'VERIFICATION',
        'DSR_VALIDATION_TASK': 'VALIDATION',
        'DSR_DATA_DISCOVERY_TASK': 'DATA_DISCOVERY',
        'DSR_FULFILLMENT_TASK': 'FULFILLMENT',
        'DSR_CLARIFICATION_TASK': 'CLARIFICATION',
        'ASSESSMENT_TASK': 'ASSESSMENT',
        'RISK_MITIGATION_TASK': 'RISK_MITIGATION'
      };
      return stageMapping[taskType] || 'GENERAL';
    }

    return 'GENERAL';
  }


  private getFileNameFromPath(filePath: string): string {
    if (!filePath) return '';
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  onActionChange(event: any) {
    this.disableActionButton = true;
    if (this.selectedAction == TaskDisplayStatusAction.REOPEN) {
      this.onReopenTaskRequest(TaskStatusActionApiMap[TaskDisplayStatusAction.REOPEN]);
    }
    else if (this.selectedAction == TaskDisplayStatusAction.RESUME_TASK) {
      this.onResumeTask();
    }
    else if (this.selectedAction == TaskDisplayStatusAction.SEND_BACK) {
      this.onReopenTaskRequest(TaskStatusActionApiMap[TaskDisplayStatusAction.SEND_BACK]);
    }
    else if (this.selectedAction == TaskDisplayStatusAction.HOLD) {
      this.onReopenTaskRequest(TaskStatusActionApiMap[TaskDisplayStatusAction.HOLD]);
    }
    else if (this.selectedAction == TaskDisplayStatusAction.CLOSE) {
      this.onCloseTaskActionFromAssignor();
    }
    else if (this.selectedAction == TaskDisplayStatusAction.SUBMIT_FOR_REVIEW) {
      this.onTaskActionForRespondent();
    }
  }

  onReopenTaskRequest(taskAction: string) {
    const dialogRef = this.dialog.open(ViewTypeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: RequestDialogTypes.TASK_REOPEN_REQUEST,
        requestId: this.taskId,
        dialogTitle: "Reason",
        positiveButtonLabel: "Submit",
        negativeButtonLabel: "Cancel",
        taskAction: taskAction
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadTaskDetails();
      }
    });
  }

  get actionOptionLength() {
    return (this.actionOptions?.length ?? 0);
  }

  get showActionItem() {
    return this.loading ? false : ((this.isAssigned || this.taskCompleted) ? false : true);
  }

  async deleteTaskConfirm(): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      disableClose: true,
      data: {
        type: 'confirmation',
        title: 'Confirm Task Deletion',
        content: 'Are you sure you want to delete this task?',
        confirmationDetail: this.taskDetails?.title || `Task ${this.taskId}`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      try {
        await firstValueFrom(this.apiHelperService.deleteTask(this.taskId));
        this.snackbarService.openSnack('Task deleted successfully');
        this.goBack();
      } catch (error) {
        this.snackbarService.openSnack('Error deleting task');
        console.error('Error:', error);
      }
    });
  }

  get taskHasAttachments() {
    return (this.taskDetails?.documentAttached?.length ?? 0);
  }

  getDocumentName(links: any) {
    return links?.documentName?.trim() ? this.getFileName(links.documentName) : this.getFileName(links.documentUrl)
  }

  get requestThrough() {
    return this.taskDetails ? (this.taskDetails?.dsrDetail?.isRequestedByThirdParty ? `${RequestThrough.THIRD_PARTY}` : `${RequestThrough.SELF}`) : `N/A`;
  }

  get dsrRequestId() {
    return this.taskDetails?.dsrDetail?.id
  }

  goToRequestDetailPage() {
    if (!this.dsrRequestId) {
      return
    }
    this.router.navigate([`${USER}/${DSRR}/${REQUEST_MANAGEMENT}/${REQUEST_MANAGEMENT_DETAILS}/${this.dsrRequestId}`],
      {
        state: {
          key: NAVIGATION_TYPE.TASK_DETAIL,
          id: this.taskId,
          isReadOnly: true
        }
      })
  }

  get canNavigate(): boolean {
    return !!(this.dsrRequestId && (!this.isInternalOrExternalUser))
  }


  async goToPrevRequest() {
    this.currentRequestDetails.index--;
    this.navigationDirection = 'prev';

    if (this.taskManagementService.getPrevRequestShifted()) {
      const tempRequestList = this.taskManagementService.getPrevRequestRid();
      this.taskManagementService.setTaskRequestRid(tempRequestList);
      const currentRequestSize = this.taskManagementService.getTaskRid()?.length ?? 0;
      this.currentRequestDetails.index = currentRequestSize - 1;
      this.taskManagementService.setPrevRequestShifted('false');
      this.taskManagementService.setPrevRequestPage(0, true);
    }
    const currentRequest = this.taskManagementService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.id);
    }
  }

  async goToNextRequest() {
    this.currentRequestDetails.index++;
    this.navigationDirection = 'next';

    if (this.taskManagementService.getNextRequestShifted()) {
      const tempNextRequestList = this.taskManagementService.getNextRequestRid();
      this.taskManagementService.setTaskRequestRid(tempNextRequestList);
      this.currentRequestDetails.index = 0;
      this.taskManagementService.setNextRequestShifted('false');
      this.taskManagementService.setNextRequestPage(0, true);
    }
    const currentRequest = this.taskManagementService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.id);
    }
  }

  get disablePrevBtn() {
    return this.taskManagementService.getPrevRequestRid()?.length == 0 || this.loading;
  }

  get getPrevRequestRid() {
    return this.taskManagementService.getPrevRequestRid()?.length;
  }

  get disableNextBtn() {
    return this.taskManagementService.getNextRequestRid()?.length == 0 || this.loading;
  }

  openNextRequest(requestRid: number) {
    this.router.navigate([`${this.currentPath}/${requestRid}`])

  }

  async updateCurrentRequestIndex() {
    let requestList = this.taskManagementService.getTaskRid();
    let nodeIndex = requestList.findIndex((request: TaskId) => request.id == this.taskId);
    if (nodeIndex > -1) {
      this.currentRequestDetails.index = nodeIndex;
      await this.loadPrevRequestList();
      await this.loadNextRequestList();
    }
  }

  async loadPrevRequestList() {
    const tempRequestList = this.taskManagementService.getTaskRid();

    if (this.currentRequestDetails.index == 0) {
      let pageData = this.taskManagementService.getNextRequestPageNo(true);
      if (pageData?.exceeded) {
        this.taskManagementService.removePrevRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.taskManagementService.setPrevRequestPage(newPageNo);
      const requestList: TaskId[] = await this.taskManagementService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.taskManagementService.setPrevRequestShifted('true');
        this.taskManagementService.setPrevRequestRid(requestList);
        return;
      }
    }

    this.taskManagementService.setPrevRequestRid(tempRequestList);
    this.taskManagementService.setPrevRequestShifted('false');
  }

  async loadNextRequestList() {
    const tempRequestList = this.taskManagementService.getTaskRid();

    const currentSize = this.taskManagementService.getTaskRid()?.length ?? 0;
    if (currentSize - this.currentRequestDetails.index == 1) {
      let pageData = this.taskManagementService.getNextRequestPageNo();
      if (pageData?.exceeded) {
        this.taskManagementService.removeNextRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.taskManagementService.setNextRequestPage(newPageNo);
      const requestList: TaskId[] = await this.taskManagementService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.taskManagementService.setNextRequestShifted('true');
        this.taskManagementService.setNextRequestRid(requestList);
        return;
      }
    }

    this.taskManagementService.setNextRequestRid(tempRequestList);
    this.taskManagementService.setNextRequestShifted('false');
  }

  get disablePrevBtnCP(): boolean {
    return !this.bpaIds || this.bpaIds.length <= 1 || this.currentIndex === 0;
  }

  get disableNextBtnCP(): boolean {
    return !this.bpaIds || this.bpaIds.length <= 1 || this.currentIndex === this.bpaIds.length - 1;
  }

  goNextAsset() {
    if (this.currentIndex < this.bpaIds.length - 1) {
      this.currentIndex++;
      const nextId = this.bpaIds[this.currentIndex];

      this.router.navigate([`${this.currentPath}/${nextId}`], {
        state: {
          assetIds: this.bpaIds,
          currentIndex: this.currentIndex,
          fromVendor: true
        }
      });
    }
  }
  goPrevAsset() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const prevId = this.bpaIds[this.currentIndex];

      this.router.navigate([`${this.currentPath}/${prevId}`], {
        state: {
          assetIds: this.bpaIds,
          currentIndex: this.currentIndex,
          fromVendor: true
        }
      });
    }
  }
}
