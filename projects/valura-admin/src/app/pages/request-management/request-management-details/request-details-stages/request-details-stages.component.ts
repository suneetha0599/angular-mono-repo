import { ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule, } from '@angular/common';
import { signal } from '@angular/core';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { buildDocumentAttachmentForm, buildRequestForm, buildValidationFormArray, recipientDetails, requestDetailLockMessage } from '../../request-utils';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DATA_DISCOVERY_ASSET_HEADER, DATA_DISCOVERY_HEADER, DOCUMENT_RECEIVED, FIRST_PAGE, HEADER_ACTION, HEADER_DATE, HEADER_NAME, HEADER_STATUS, PAGE_SIZE, REQUEST_DATA_FULFILLMENT_HEADER, RequestAction, RequestDialogTypes, RequestDisplayStage, RequestLeftSection, RequestValidationQuestionsTypes, RequestStageTab, PRIORITY, LOE, RequestLockType, VERIFICATION_TABS, VALIDATION_TABS, DATA_MAPPING_TABS, FULFILLMENT_TABS, HEADER_CATEGORY } from '../../constant';
import { ActivityStepperComponent } from '../../activity-stepper/activity-stepper.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ViewTypeDialogComponent } from '../../request-management-dialog/view-type-dialog/view-type-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { DsrRequestDetails, RequestDocuments, RequestTask, RequestTaskListParams } from '@admin-core/models/request-management/DsrRequest';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { formatPriority, formatStatus, getPriorityIcon, priorityTextColor, statusColors, statusTextColors, formatEffortLevel } from '../../../task-management/task-utils';
import { SplitByDirectivesDirective } from '../../../../../../../valura-lib/src/lib/directives/split-by-directives';
import { DataFufillmentDialogComponent } from '../../request-management-dialog/data-fufillment-dialog/data-fufillment-dialog.component';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, EXTERNAL_USER, GLOBAL_DIALOG_DEFAULTS, INTERNAL_USER } from '@admin-core/constants/constants';
import { UserService } from '@admin-core/services/user/user.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { ConversationScreenComponent } from '../conversation-screen/conversation-screen.component';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components/popup-dialog/popup-dialog.component';
import { v1 as uuidv1 } from 'uuid';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';

const { USER, DATA_INVENTORY, DATA_DISCOVERY } = routeConstants

interface Attachment {
  id: number;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedOn: string;
  fileKey?: string;

}
export interface ResponseFile {
  fileKey: string
}
@Component({
  selector: 'request-details-stages',
  imports: [CommonModule, LoadingButtonComponent, MatButtonModule, MatTabsModule, ConversationScreenComponent, MatIconModule, MatSelectModule, ReactiveFormsModule, FormsModule, MatFormFieldModule,
    MatInputModule, MatRadioModule, MatCheckboxModule, CdkAccordionModule, MatTable, MatHeaderCell, MatColumnDef, MatHeaderCellDef, MatCellDef,
    MatCell, MatHeaderRow, MatRow, MatHeaderRowDef, MatRowDef, MatSortModule, ActivityStepperComponent, MatMenuModule, MatPaginatorModule, SplitByDirectivesDirective, MatTooltipModule, ItemNotFoundComponent],

  templateUrl: './request-details-stages.component.html',
  styleUrl: './request-details-stages.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class RequestDetailsStagesComponent {

  @Input() isFullscreen: boolean = false;
  @Input() requestStage: string = '';
  @Input() requestRid: number = 0;
  @Input() event: string = '';
  @Input() selectedRequestLeftSection: string = RequestLeftSection.DETAILS
  @Input() progressPercentage: number = 0
  @Input() dsrRequestDetails!: DsrRequestDetails
  @Input() documentDetail!: RequestDocuments;
  @Input() stageCompleted: boolean = false
  @Input() documentsList: any[] = []
  @Output() onNextValidate = new EventEmitter<any>()
  @Output() onViewTaskDetails = new EventEmitter<any>()
  @Output() onToggleFullScreen = new EventEmitter<any>()
  @Output() onOpenCreateTaskDrawer = new EventEmitter<any>()
  @Output() onOpenEditTaskDrawer = new EventEmitter<any>()

  stage: string = ''
  requestDetailForm!: FormGroup;
  tableHeaders: any = [];
  displayedHeaders = [];
  noteItemList = new MatTableDataSource<any>();
  requestTaskDatasource = new MatTableDataSource<any>();
  requestTaskList: RequestTask[] = []
  requestItemColumns: string[] = ['source', 'type', 'status', 'attr1', 'attr2', 'attr3', 'actions'];
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedRightTab: string = ''

  PRIORITY = PRIORITY
  LOE = LOE
  HEADER_DATE = HEADER_DATE
  HEADER_ACTION = HEADER_ACTION
  HEADER_STATUS = HEADER_STATUS
  HEADER_NAME = HEADER_NAME
  HEADER_CATEGORY = HEADER_CATEGORY
  RequestDisplayStage = RequestDisplayStage
  requestItems = [];
  showAddNotes: boolean = false;
  expandedElements = new Set<number>();
  dataDiscoveryList = new MatTableDataSource<any>();
  DATA_DISCOVERY_HEADER = DATA_DISCOVERY_HEADER;
  DATA_DISCOVERY_ASSET_HEADER = DATA_DISCOVERY_ASSET_HEADER;
  HEADER_EXPAND = 'expand';
  selectedTabIndex: number = 0
  addButtonLabel: string = ''
  positiveButtonLabel: string = ''
  negativeButtonLabel: string = ''
  isDoneLoading: boolean = false
  addNotesLoading: boolean = false
  INCREMENT_COUNT = 10
  RequestValidationQuestionsTypes = RequestValidationQuestionsTypes
  pageSize: number = PAGE_SIZE
  FIRST_PAGE = FIRST_PAGE
  totalItems: number = 0;
  pageNo: number = FIRST_PAGE
  RequestStageTab = RequestStageTab
  HUMAN_REVIEW_OF_AUTOMATED_DECISION = false;
  dialogRef: MatDialogRef<any> | null = null;
  taskLoading: boolean = false
  showActionMenu: boolean = true;
  auditLogModule = AUDIT_LOG_MODULE.DSR;
  entityType = AUDIT_LOG_ENTITY_TYPE.DSR_REQUEST;
  showCreateTaskButton: boolean = false;
  currentPath: string = '';
  attachmentsList: Attachment[] = [];
  selectedFiles: File[] = [];
  currentUser: string = 'Current User';
  VERIFICATION_TABS = VERIFICATION_TABS;
  VALIDATION_TABS = VALIDATION_TABS;
  DATA_MAPPING_TABS = DATA_MAPPING_TABS;
  FULFILLMENT_TABS = FULFILLMENT_TABS;
  refreshMessageUpdates: string = '';
  tooltipMessage: string = '';
  highlightMessageId: number = 0
  detailList: string[] = [];

  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private userService = inject(UserService);
  private rolePermissionService = inject(RolePermissionService);

  private readonly taskDetailsLoading = signal<Map<number, boolean>>(new Map());
  private readonly taskDetailsError = signal<Map<number, string>>(new Map());

  readonly isTaskLoading = (taskId: number) => this.taskDetailsLoading().get(taskId) || false;
  readonly getTaskError = (taskId: number) => this.taskDetailsError().get(taskId) || null;

  @ViewChild('actionsDialog') actionsDialogTemplate!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('dataDiscoveryExpandedTemplate', { static: true }) dataDiscoveryExpandedTemplate!: TemplateRef<any>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(ConversationScreenComponent) conversationComponent!: ConversationScreenComponent;

  constructor(public dialog: MatDialog, public requestService: RequestManagementService, private fb: FormBuilder, private router: Router, private cdr: ChangeDetectorRef, private route: ActivatedRoute) {
  }
  tabFromQuery = false
  ngOnInit(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');

    this.route.queryParams.subscribe(params => {
      const tabKey = params['tab']
      const messageId = params['id']

      if (messageId) {
        this.highlightMessageId = messageId;
      }


      if (!tabKey) return;

      this.tabFromQuery = true;
      this.selectedRightTab = tabKey;
      Promise.resolve().then(() => {
        this.setTaskTabIndex(tabKey);

        if (tabKey === RequestStageTab.CONVERSATION) {
          this.setConversationDetails();
        }

        this.cdr.detectChanges();
      });
    });
  }

  ngAfterViewInit(): void {
    this.setTablePaginator();
  }

  ngOnDestroy() {
  }


  ngOnChanges(changes: SimpleChanges): void {
    let shouldInitializePage = false;
    let shouldSetPageInfo = false;

    if (changes['requestStage']) {
      this.stage = this.requestStage;
      shouldInitializePage = true;
      shouldSetPageInfo = true;
    }

    if (changes['dsrRequestDetails']) {
      if (!changes['requestStage']) {
        shouldInitializePage = true;
        shouldSetPageInfo = true;
      }
    }
    if (changes['stageCompleted']) {
      if (!changes['requestStage'] && !changes['dsrRequestDetails']) {
        shouldSetPageInfo = true;
      }
    }

    if (changes['selectedRequestLeftSection']) {
      shouldSetPageInfo = true;
    }

    if (changes['documentDetail'] && this.documentDetail) {
      this.patchDocumentDetail();
    }
    if (shouldInitializePage) {
      this.onInitPage();
    }

    if (shouldSetPageInfo) {
      this.setPageInfo();
    }
  }

  handleAttachmentsUpdate(attachments: Attachment[]): void {
    this.attachmentsList = attachments;
  }

  get isRequestClosed(): boolean {
    return this.dsrRequestDetails?.dsrDetails?.state === 'CLOSED';
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        this.selectedFiles.push(input.files[i]);
      }
      input.value = '';
    }
  }




  getPriorityTextColor(priority: string): string {
    return priorityTextColor(priority)
  }


  getPriorityIcon(priority: string): string {
    return getPriorityIcon(priority)
  }

  downloadAttachment(attachment: Attachment): void {
  }

  deleteAttachment(attachmentId: number): void {
    this.attachmentsList = this.attachmentsList.filter(a => a.id !== attachmentId);
  }

  private sortFieldMapping: any = {
    taskId: 'id',
    title: 'title',
    description: 'description',
    dueDate: 'dueDate',
    status: 'status',
    levelOfEffort: 'levelOfEffort',
    priority: 'priority',
    createdOn: 'createdAt',
    taskType: 'taskType'
  };

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];
    if (backendField) {
      this.sortColumn = backendField;
      this.sortDirection = event.direction || 'asc';
      this.getRequestTaskList(this.FIRST_PAGE, backendField, event.direction);
    }
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }

  sortData() {
    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;

    this.requestItems.sort((a: any, b: any) => {
      const aVal = (a[col] || '').toString().toLowerCase();
      const bVal = (b[col] || '').toString().toLowerCase();

      return aVal.localeCompare(bVal) * dir;
    });
  }


  openRenameDialog() {
    this.dialogRef = this.dialog.open(this.actionsDialogTemplate, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: false,
      position: { right: '200' },
      panelClass: 'dialog-wrapper',
    });
  }

  handleFileUpload(event: any) {

  }

  buildRequestForm() {
    this.requestDetailForm = buildRequestForm(this.fb)
    if (this.event == RequestAction.VALIDATE_REQUEST) {
      this.buildValidationQuestionForm()
    }
  }

  get verification(): FormGroup {
    return this.requestDetailForm.get("verification") as FormGroup
  }

  get documentAttachment(): FormArray {
    return this.verification.get("documentAttachment") as FormArray
  }

  get notes(): FormGroup {
    return this.verification.get("notes") as FormGroup
  }

  get requestValidation(): FormGroup {
    return this.requestDetailForm.get("requestValidation") as FormGroup
  }

  get validationSectionList(): FormArray {
    return this.requestValidation.get("validationSectionList") as FormArray
  }

  get documentReviewed(): FormControl {
    return this.requestValidation.get("documentReviewed") as FormControl
  }

  get documentAttachmentControls(): any {
    return this.documentAttachment?.controls ?? []
  }

  get validationSectionControls(): any {
    return this.validationSectionList?.controls ?? []
  }

  getValidationQuestions(index: number) {
    return this.validationSectionList.at(index).get('validationQuestions') as FormArray;
  }

  getValidationQuestionsControls(index: number) {
    return this.getValidationQuestions(index)?.controls ?? []
  }

  get requestFulfillment(): FormGroup {
    return this.requestDetailForm.get("requestFulfillment") as FormGroup
  }

  get requestFulfillmentVerified(): FormControl {
    return this.requestFulfillment.get("requestFulfillmentVerified") as FormControl
  }

  async onInitPage() {
    if (!this.dsrRequestDetails) {
      return
    }
    const routeBack = this.requestService.routeBack  // //restore the tab status after navigate back from task detail page
    if (routeBack == RequestStageTab.TASKS) {
      this.setTaskListView()
      this.requestService.deleteRouteBack()
    }

    this.buildRequestForm();
    if (this.event == RequestAction.VERIFY_DS_IDENTITY) {
      if (this.taskTabIsSelected) {
        this.setRequestTaskLists(true);
        return
      }
      this.selectedRightTab = RequestStageTab.VERIFICATION_STAGE_DETAIL
    }
    else if (this.event == RequestAction.VALIDATE_REQUEST) {
      if (this.taskTabIsSelected) {
        this.setRequestTaskLists(true);
        return
      }
      this.selectedRightTab = RequestStageTab.VALIDATION_STAGE_DETAIL
    }
    else if (this.event == RequestAction.DATA_DISCOVERY) {
      if (this.taskTabIsSelected) {
        this.setRequestTaskLists(true);
        return
      }
      this.selectedRightTab = RequestStageTab.DATA_MAPPING_STAGE_DETAIL
      this.setDataDiscoveryDetails();
    }
    else if (this.event == RequestAction.REQUEST_FULFILLMENT) {
      if (this.taskTabIsSelected) {
        this.setRequestTaskLists(true);
        return
      }
      this.selectedRightTab = RequestStageTab.DATA_FULFILLMENT_STAGE_DETAIL
      return
    }
  }

  setDataDiscoveryDetails() {
    this.tableHeaders = DATA_DISCOVERY_HEADER;
    this.setDataDiscoveryData();
    if (this.tableHeaders?.length) {
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
    }
  }

  async setDataDiscoveryData() {
    const dataSubjectList = this.dsrRequestDetails?.processingDetails?.dataMapping?.pdMappingList || [];
    const transformedData = await this.requestService.preparePdMappingList(dataSubjectList);
    this.dataDiscoveryList = new MatTableDataSource(transformedData);
  }

  setConversationDetails() {
    this.refreshMessageUpdates = uuidv1();
  }

  toggleRow(element: any) {
    if (!this.canExpand(element)) {
      return;
    }

    const elementId = element.id;
    if (this.expandedElements.has(elementId)) {
      this.expandedElements.delete(elementId);
    } else {
      this.expandedElements.add(elementId);
    }


    this.dataDiscoveryList._updateChangeSubscription();
  }

  isExpanded(element: any): boolean {
    if (!element || element.id === undefined) {
      return false;
    }
    return this.expandedElements.has(element.id);
  }

  canExpand(element: any): boolean {
    return element?.assetInvolvedList?.length > 0;
  }

  isExpandedRow = (index: number, item: any): boolean => {
    return this.isExpanded(item);
  };

  trackByAssetFn(index: number, asset: any): any {
    return asset.assetName || index;
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }



  isExpandableRow = (index: number, item: any) => {
    return item.hasOwnProperty('detailRow');
  };


  onTabChange(event: number) {
    this.selectedTabIndex = event
    if (this.stage == RequestDisplayStage.REQUEST_VERIFICATION) {
      this.selectedRightTab = VERIFICATION_TABS[this.selectedTabIndex].key
    }
    else if (this.stage == RequestDisplayStage.REQUEST_VALIDATION) {
      this.selectedRightTab = VALIDATION_TABS[this.selectedTabIndex].key
    }
    else if (this.stage == RequestDisplayStage.DATA_DISCOVERY) {
      this.selectedRightTab = DATA_MAPPING_TABS[this.selectedTabIndex].key
    }
    else if (this.stage == RequestDisplayStage.REQUEST_FULFILLMENT) {
      this.selectedRightTab = FULFILLMENT_TABS[this.selectedTabIndex].key
    }
    if (this.selectedRightTab == RequestStageTab.DATA_MAPPING_STAGE_DETAIL) {
      this.setDataDiscoveryDetails()
      return
    }
    if (this.selectedRightTab == RequestStageTab.CONVERSATION) {
      this.setConversationDetails()
      return;
    }
    if (this.selectedRightTab == RequestStageTab.TASKS) {
      this.setRequestTaskLists();
      return
    }
  }

  onAdd() {
    this.openCreateTaskDialog();
  }

  onCancelClick() {
    this.showAddNotes = false
  }

  get showRequestDocumentsTab() {
    return this.selectedRequestLeftSection == RequestLeftSection.DOCUMENTS
  }

  resetFlags() {
    this.addButtonLabel = ""
    this.positiveButtonLabel = ""
    this.negativeButtonLabel = ""
    this.showActionMenu = false
    this.tooltipMessage = ""
    this.isDoneLoading = false
  }

  setPageInfo() {
    if (this.restrictAction || !this.isAssignedRequest) {
      this.resetFlags()
      return
    }

    if (this.stageCompleted) {
      this.resetFlags()
      this.patchRequestDeclarations();
      this.setReopenRequest();
      return
    }
    this.setUserPermissions()
    if (this.event == RequestAction.VERIFY_DS_IDENTITY && this.requestService.verificationCurrentStage(this.dsrRequestDetails.stageMeta)) {
      if (this.requestService.showDocumentRequestBtn(this.dsrRequestDetails.dsrDetails.state) && this.showCreateTaskButton) {
        this.addButtonLabel = "Create Task"
      }
      /* Primary button label */
      if (this.showVerifyThirdPartyDetailsBtn) {
        this.positiveButtonLabel = "Verify Third Party";
        this.tooltipMessage = this._tooltipMessage;
      }
      else if (this.requestService.showRequestVerificationBtn(this.dsrRequestDetails.dsrDetails.state) || this.requestService.showDocumentVerificationBtn(this.dsrRequestDetails.dsrDetails.state)) {
        this.positiveButtonLabel = "Verify Data Subject";
        this.tooltipMessage = this._tooltipMessage;
      }
      /* Secondary button label */
      // if (this.requestService.showRejectFormBtn(this.dsrRequestDetails.dsrDetails.state)) {
      this.negativeButtonLabel = "Reject"
      // }
    }
    else if (this.event == RequestAction.VALIDATE_REQUEST && this.requestService.validationCurrentStage(this.dsrRequestDetails.stageMeta)) {
      if (this.showCreateTaskButton) {
        this.addButtonLabel = "Create Task"
      }
      this.positiveButtonLabel = "Send Acknowledgement"
      this.negativeButtonLabel = "Reject"
    }
    else if (this.event == RequestAction.DATA_DISCOVERY && this.requestService.dataMappingCurrentStage(this.dsrRequestDetails.stageMeta)) {
      if (this.showCreateTaskButton) {
        this.addButtonLabel = "Create Task"
      }
      this.positiveButtonLabel = "Next" //https://devappsys.atlassian.net/browse/VAL-226
      this.negativeButtonLabel = ""
    }
    else if (this.event == RequestAction.REQUEST_FULFILLMENT && this.requestService.datafulfillmentCurrentStage(this.dsrRequestDetails.stageMeta)) {
      this.positiveButtonLabel = "Complete Stage"
      if (this.showCreateTaskButton) {
        this.addButtonLabel = "Create Task"
      }
    }
    else if (this.event == RequestAction.AUDIT_AND_CLOSE && this.requestService.auditCloseCurrentStage(this.dsrRequestDetails.stageMeta)) {
      this.positiveButtonLabel = "Close"
      this.negativeButtonLabel = ""
    }
    this.setReopenRequest();
    this.isDoneLoading = false
  }

  setReopenRequest() {
    // To reopen the request
    if (this.canReopenRequest) {
      this.negativeButtonLabel = "Reopen"
    }
  }

  get canReopenRequest(): boolean {
    return this.dsrRequestDetails.dsrDetails?.canReopen
  }

  onDoneClick() {
    if (!this.isTaskCompleted() && !this.requestService.requestCancelledorRejected(this.dsrRequestDetails.dsrDetails.state)) {
      this.snackbarService.openSnack(this.taskPendingMessage);
    }
    else {
      if (this.event == RequestAction.VERIFY_DS_IDENTITY && this.requestService.verificationCurrentStage(this.dsrRequestDetails.stageMeta)) {
        this.onSubmitRequestVerificationDetails()
      }
      else if (this.event == RequestAction.VALIDATE_REQUEST && this.requestService.validationCurrentStage(this.dsrRequestDetails.stageMeta)) {
        this.onRequestValidation()
      }
      else if (this.event == RequestAction.DATA_DISCOVERY && this.requestService.dataMappingCurrentStage(this.dsrRequestDetails.stageMeta)) {
        this.onRequestDataMapping()
      }
      else if (this.event == RequestAction.REQUEST_FULFILLMENT && this.requestService.datafulfillmentCurrentStage(this.dsrRequestDetails.stageMeta)) {
        this.onDataFulfillmentCompleted()
      }
      else if (this.event == RequestAction.AUDIT_AND_CLOSE && this.requestService.auditCloseCurrentStage(this.dsrRequestDetails.stageMeta)) {
        this.onRequestAuditAndClose()

      }
    }
  }


  onDownload() {
    this.router.navigate(
      [`${USER}/${DATA_DISCOVERY}/${DATA_INVENTORY}`],
      { queryParams: { isImportNeeded: true } }
    );
  }

  onDocNameClick(attachment: Attachment): void {
    if (!attachment?.fileKey) {
      console.error('No fileKey found for document', attachment);
      return;
    }
    this.viewDocument(attachment.fileKey, attachment.name);
  }

  async viewDocument(file: any, fileName: string) {
    const params = {
      fileKey: file,
    };
    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: this.getFileName(fileName) || '',
          requestRid: this.requestRid,
          isTaskView: true,
        },
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        maxWidth: '100vh',
        disableClose: false,
        panelClass: 'dialog-wrapper',
        autoFocus: false,
      });
      dialogRef.afterClosed().subscribe((result) => { });
    } else {
      console.error('Failed to get presigned URL');
    }
  }

  getFileName(fileKey: string): string {
    if (!fileKey) return '';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
  }


  onSecondaryButtonClick() {
    if (this.canReopenRequest) {
      this.onReopenRequestClick()
    }
    else if (this.event == RequestAction.VALIDATE_REQUEST) {
      this.cancelRequest()
      // const dialogTypes = RequestDialogTypes.VALIDATE_REQUEST_CANCEL;
      // this.openConfirmDsIdentityDialog(dialogTypes, this.event, true);
    }
    else if (this.event == RequestAction.VERIFY_DS_IDENTITY) {
      this.cancelRequest()
      // this.onSubmitRequestVerificationDetails(true)
    }
    else if (this.event == RequestAction.REQUEST_FULFILLMENT) {
      this.openCreateTaskDialog()
    }
  }

  cancelRequest() {
    const dialogRef = this.dialog.open(ViewTypeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: RequestDialogTypes.REQUEST_VALIDATION_CANCEL,
        requestId: this.requestRid,
        dialogTitle: "Reject Reason",
        eventName: this.event,
        stage: this.stage,
        validationQuestions: this.validationSectionList.value,
        dsrRequestDetails: this.dsrRequestDetails,
        positiveButtonLabel: "Save",
        negativeButtonLabel: "Cancel",
        emailTemplateData: {
          ...recipientDetails(this.dsrRequestDetails)
        },
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.requestRejected) {
        this.onNextValidate.emit({ refreshDetail: true })
      }
    });
  }

  sendAcknowledgement() {
    const dialogRef = this.dialog.open(ViewTypeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: RequestDialogTypes.VALIDATE_REQUEST,
        requestId: this.requestRid,
        dialogTitle: "Send Acknowledgement",
        event: this.event,
        stage: this.stage,
        validationQuestions: this.validationSectionList.value,
        dsrRequestDetails: this.dsrRequestDetails,
        positiveButtonLabel: "Done",
        negativeButtonLabel: "Cancel",
        emailTemplateData: {
          ...recipientDetails(this.dsrRequestDetails)
        },
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onNextValidate.emit({ refreshDetail: true })
      }
    });
  }

  onSubmitRequestVerificationDetails(isCancel: boolean = false) {
    if (this.showVerifyThirdPartyDetailsBtn) {
      const dialogTypes = RequestDialogTypes.VERIFY_THIRD_PARTY;
      const eventName = RequestAction.VERIFY_THIRD_PARTY;
      this.openConfirmDsIdentityDialog(dialogTypes, eventName, isCancel);
      return
    }

    if (this.requestService.showRequestVerificationBtn(this.dsrRequestDetails.dsrDetails.state) || this.requestService.showDocumentVerificationBtn(this.dsrRequestDetails.dsrDetails.state)) {
      const dialogTypes = RequestDialogTypes.VERIFY_DS_IDENTITY
      this.openConfirmDsIdentityDialog(dialogTypes, this.event, isCancel);
      return
    }
  }

  onRequestValidation() {
    if (this.requestValidation.invalid) {
      this.snackbarService.openSnack("Form is invalid!")
      return
    }
    // if (this.HUMAN_REVIEW_OF_AUTOMATED_DECISION) {
    this.sendAcknowledgement()
    // }
    // const data = { validationQuestion: this.validationSectionList.value, "validateRequest": true, rejectionReason: "" }
    // this.saveDsrVerificationDetails(data, true)
  }

  onRequestDataMapping() {
    const data = {}
    this.saveDsrVerificationDetails(data, true)
  }

  saveDsrVerificationDetails(data: any, goToNextStep: boolean = false, eventName: string = "") {
    const event = eventName ? eventName : this.event;
    const body = {
      "data": data
    }
    this.isDoneLoading = true
    this.apiHelperService.saveDsrRequestDetails(body, this.requestRid, event)
      .subscribe({
        next: async (res) => {
          this.postSuccessVerification(res, goToNextStep)
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isDoneLoading = false
        },
      });
  }

  onDataFulfillmentCompleted() {
    if (!this.isTaskCompleted()) {
      this.snackbarService.openSnack(this.taskPendingMessage);
      return
    }
    this.openDataFulFillmentDialog()
    return
  }

  isTaskCompleted() {
    return this.dsrRequestDetails.pendingTaskCount == 0;
  }

  get taskPendingMessage(): string {
    return `A task is still pending. Please complete it before proceeding to the next stage.`;
  }


  onRequestAuditAndClose() {
    let data = {}
    this.saveDsrVerificationDetails(data, true, this.event)
  }

  postSuccessVerification(res: any, goToNextStep: boolean = false) {
    if (goToNextStep) {
      this.onNextValidate.emit({ refreshDetail: true })
    }
  }

  onAddNotes() {
    if (this.notes.invalid) {
      this.notes.markAllAsTouched()
      this.snackbarService.openSnack("Form is invalid!")
      return
    }
    const body = {
      "title": this.notes.get('title')?.value ?? '',
      "description": this.notes.get('description')?.value ?? '',
    }
    this.addNotesLoading = true
    this.apiHelperService.saveRequestNotes(body, this.requestRid)
      .subscribe({
        next: async (res) => {
          this.addNotesLoading = false
          this.onNextValidate.emit({ refreshNotes: true })
          this.notes.reset()
        },
        error: (e: Error) => {
          console.error(e.message);
          this.addNotesLoading = false
        },
      });
  }

  buildValidationQuestionForm() {
    this.validationSectionList.clear();
    if (this.dsrRequestDetails.processingDetails.validation) {
      this.dsrRequestDetails.processingDetails.validation.validationQuestion = [];
      const validationQuestions = [{
        sectionName: "General",
        validationQuestions: this.dsrRequestDetails.processingDetails.validation.generalValidationQuestion,
      },
      {
        sectionName: "Specific",
        validationQuestions: this.dsrRequestDetails.processingDetails.validation.specificValidationQuestion,
      }];

      this.dsrRequestDetails.processingDetails.validation.validationQuestion = [...validationQuestions]
      for (const validation of this.dsrRequestDetails.processingDetails.validation.validationQuestion) {
        const formGroup = buildValidationFormArray(this.fb, validation, this.stageCompleted);
        this.validationSectionList.push(formGroup);
      }
    }
  }

  documentReviewedOnChange(event: MatCheckboxChange, documentReview: boolean = false) {
    if (!event.checked) {
      if (documentReview) {
        this.documentReviewed.patchValue(null);
        return
      }
      this.requestFulfillmentVerified.patchValue(null);
    }
  }

  get documentReceivedState(): boolean {
    return (this.dsrRequestDetails?.dsrDetails?.state == DOCUMENT_RECEIVED)
  }

  patchDocumentDetail() {
    this.documentAttachment.clear()
    const documentAttachmentForm = buildDocumentAttachmentForm(this.fb, this.documentDetail)
    this.documentAttachment.push(documentAttachmentForm)
  }

  deleteDocumentDetail(index: number) {
    this.documentAttachment.removeAt(index)
  }

  async deleteTask(task: RequestTask): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      disableClose: true,
      data: {
        type: 'confirmation',
        title: 'Confirm Task Deletion',
        content: 'Are you sure you want to delete this task?',
        confirmationDetail: task.title || `Task ${task.taskId}`,
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
        await firstValueFrom(this.apiHelperService.deleteTask(task.taskId));
        const message = 'Task deleted successfully';
        this.snackbarService.openSnack(message);
        this.postSuccessVerification({}, true);
      } catch (error) {
        this.snackbarService.openSnack('Error deleting task');
        console.error('Error:', error);
      }
    });
  }

  async openTaskDetails(task: RequestTask): Promise<void> {
    if (!task?.taskId) {
      this.snackbarService.openSnack('Invalid task selected');
      return;
    }

    this.setTaskLoading(task.taskId, true);
    this.clearTaskError(task.taskId);

    try {
      const taskDetails = await this.fetchTaskDetails(task.taskId);

      if (!taskDetails) {
        throw new Error('Failed to fetch task details');
      }

      this.openTaskDialog(taskDetails, 'Task Details');

    } catch (error) {
      console.error('Error fetching task details:', error);

      this.setTaskError(task.taskId, this.getErrorMessage(error));

      this.snackbarService.openSnack('Failed to load task details. Please try again.');
      this.openTaskDialog(task, 'Task Details (Offline Data)');

    } finally {
      this.setTaskLoading(task.taskId, false);
    }
  }


  private async fetchTaskDetails(taskId: number): Promise<RequestTask | null> {
    try {
      const response = await this.apiHelperService.getTaskDetails(taskId);

      if (!response) {
        throw new Error('No response received from server');
      }

      return this.transformTaskResponse(response);

    } catch (error) {
      console.error(`Failed to fetch task details for taskId: ${taskId}`, error);
      throw error;
    }
  }


  private transformTaskResponse(apiResponse: any): RequestTask {
    const taskData = apiResponse.data || apiResponse;

    return {
      taskId: taskData.taskId || taskData.id,
      title: taskData.title || taskData.name || '',
      description: taskData.description || '',
      status: taskData.status || 'UNKNOWN',
      priority: taskData.priority || 'MEDIUM',
      taskType: taskData.taskType || taskData.type || 'GENERAL',
      assignToUserId: taskData.assignToUserId || taskData.assignedTo || taskData.assigneeId,
      assignToUserType: taskData.assignToUserType || 'INTERNAL_USER',
      assignToUserName: taskData.assignToUserName || '',
      assigneeType: this.mapAssigneeTypeFromApi(taskData.assignToUserType || taskData.assigneeType),
      dueDate: taskData.dueDate || taskData.deadline,
      createdDate: taskData.createdDate || taskData.createdAt,
      updatedDate: taskData.updatedDate || taskData.lastUpdatedOn,
      lastUpdatedOn: taskData.lastUpdatedOn,
      documents: this.extractDocumentIds(taskData.documentAttached || taskData.documents || []),
      attachments: this.extractAttachments(taskData.documentUploaded || taskData.attachments || []),
      attributesCount: taskData.attributesCount || 0,
      documentRequired: Boolean(taskData.documentRequired),
      parentTaskId: taskData.parentTaskId || taskData.parentId || 0,
      state: taskData.state || 'OPEN',
      isCompleted: taskData.isCompleted || false,
      completed: taskData.completed || taskData.isCompleted || false,
      processed: taskData.processed || false,
      remarks: taskData.remarks || '',
      documentAttached: taskData.documentAttached || [],
      documentUploaded: taskData.documentUploaded || [],

      taskDetails: taskData.taskDetails || {},
      taskResolutionDetails: taskData.taskResolutionDetails || {},
      subTasks: taskData.subTasks || [],
      taskActionLoading: false,
      isLoading: false,
      exemptedCount: taskData.exemptedCount || 0,
      assignedBy: taskData.assignedBy || '',

      ...taskData
    } as RequestTask;
  }

  private mapAssigneeTypeFromApi(apiAssigneeType: string): string {
    const mapping: { [key: string]: string } = {
      'INTERNAL_USER': 'INTERNAL',
      'EXTERNAL_USER': 'EXTERNAL',
      'DATA_SUBJECT': 'DATA_SUBJECT',
      'APPLICATION_USER': 'INTERNAL'
    };

    return mapping[apiAssigneeType] || 'INTERNAL';
  }

  /**
   * Extract document IDs from API response
   */
  private extractDocumentIds(documents: any[]): string[] {
    if (!Array.isArray(documents)) return [];

    return documents.map(doc => {
      if (typeof doc === 'string') return doc;
      return doc.id || doc.documentId || doc.fileKey || '';
    }).filter(id => id !== '');
  }

  /**
   * Extract attachments from API response
   */
  private extractAttachments(attachments: any[]): any[] {
    if (!Array.isArray(attachments)) return [];

    return attachments.map(att => ({
      fileName: att.fileName || att.name || 'Unknown File',
      fileKey: att.fileKey || att.key || '',
      fileSize: att.fileSize || att.size || 0,
      eTag: att.eTag || ''
    }));
  }

  private openTaskDialog(task: RequestTask, dialogTitle: string = 'Task Details'): void {
    const enhancedTask = this.enhanceTaskData(task);

    // Emit task data to parent to open the drawer instead of dialog
    this.onOpenEditTaskDrawer.emit(enhancedTask);
    return;

    // OLD CODE - Using dialog (commented out for reference)
    /*
    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        requestRid: this.requestRid,
        task: enhancedTask,
        parentTask: null,
        dialogTitle: dialogTitle,
        dialogType: RequestDialogTypes.DATA_FULFILLMENT_TASK,
        componentStage: this.stage,
        requestService: this.requestService,
        isEditMode: true,
        dsrRequestDetails: this.dsrRequestDetails,
        documentsList: this.documentsList
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.taskUpdated) {
        this.postSuccessVerification(result, true);
      }
      if (result?.newUserIsCreated?.internalUser) {
        const userType = [INTERNAL_USER]
        this.userService.getAllUserMasterList(true, userType)
      }
      if (result?.newUserIsCreated?.externalUser) {
        const userType = [EXTERNAL_USER]
        this.userService.getAllUserMasterList(true, userType)
      }
    });
    */
  }

  /**
   * Enhance task data to ensure all required fields are present
   */
  private enhanceTaskData(task: RequestTask): RequestTask {
    return {
      ...task,
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      taskType: task.taskType || 'DSR_FULFILLMENT_TASK',
      assigneeType: task.assigneeType || 'INTERNAL',
      documents: task.documents || [],
      attachments: task.attachments || [],
      documentRequired: Boolean(task.documentRequired)
    };
  }

  openCreateTaskDialog(task: RequestTask | null = null): void {
    if (task) {
      this.openTaskDetails(task);
      return;
    }
    // Emit event to parent to open the Create Task Drawer
    this.onOpenCreateTaskDrawer.emit();
  }

  /**
   * Set loading state for a specific task
   */
  private setTaskLoading(taskId: number, loading: boolean): void {
    const currentMap = new Map(this.taskDetailsLoading());
    currentMap.set(taskId, loading);
    this.taskDetailsLoading.set(currentMap);
  }

  /**
   * Set error state for a specific task
   */
  private setTaskError(taskId: number, error: string): void {
    const currentMap = new Map(this.taskDetailsError());
    currentMap.set(taskId, error);
    this.taskDetailsError.set(currentMap);
  }

  /**
   * Clear error state for a specific task
   */
  private clearTaskError(taskId: number): void {
    const currentMap = new Map(this.taskDetailsError());
    currentMap.delete(taskId);
    this.taskDetailsError.set(currentMap);
  }

  /**
   * Extract user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return 'An unexpected error occurred';
  }

  toggleFullScreen() {
    this.isFullscreen = !this.isFullscreen
    this.onToggleFullScreen.emit({ isFullscreen: this.isFullscreen })
  }

  syncData() {
    this.apiHelperService.reSyncData(this.requestRid).subscribe({
      next: async (res) => {
        const params = { isDraft: false }
        const data = await this.apiHelperService.getDsrRequestDetails(this.requestRid, params);
        if (data) {
          const dsrRequestDetails = { ...data };
          this.dsrRequestDetails = dsrRequestDetails;
        }
      },
      error: (err) => {
        console.error("Resync failed", err);
      }
    });
  }

  setRequestTaskLists(forceLoad: boolean = false) {

    this.tableHeaders = REQUEST_DATA_FULFILLMENT_HEADER;
    this.requestTaskDatasource = new MatTableDataSource<RequestTask[]>;
    if (this.tableHeaders?.length) {
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
    }
    if (this.requestTaskList?.length && (!forceLoad)) {
      this.requestTaskDatasource = new MatTableDataSource(this.requestTaskList);
      return
    }
    if (this.taskLoading) { return }
    this.taskLoading = true
    this.getRequestTaskList()
  }

  async getRequestTaskList(
    pageNo: number = FIRST_PAGE,
    sortBy: string = this.sortColumn,
    sortDirection: string = this.sortDirection
  ) {
    const params: RequestTaskListParams = {
      page: pageNo,
      size: this.pageSize,
      stage: this.requestService.getStageForTask(this.stage)
    };
    if (sortBy) {
      params['sortBy'] = sortBy;
    }
    if (sortDirection) {
      params['sortDirection'] = sortDirection.toUpperCase();
    }
    const res = await this.apiHelperService.getRequestTaskList(
      this.requestRid,
      params
    );
    this.taskLoading = false
    this.pageNo = pageNo;
    if (res) {
      this.requestTaskDatasource = new MatTableDataSource(res.taskListings);
      this.requestTaskList = res.taskListings;
      if (pageNo == FIRST_PAGE) {
        this.totalItems = +(res?.totalElements ?? 0);
        if (this.paginator) {
          this.paginator.firstPage();
        }
      }
    }
  }

  getStatusColors(status: string): string {
    return statusColors(status)
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status)
  }

  getStatusText(status: string): string {
    return formatStatus(status)
  }

  getPriority(priority: string): string {
    return formatPriority(priority)
  }

  getEffortLevel(effortLevel: string): string {
    return formatEffortLevel(effortLevel)
  }

  get showVerifyThirdPartyDetailsBtn() {
    return this.isThirdPartyRequest && !this.dsrRequestDetails.processingDetails?.verification?.thirdPartyVerificationDetails?.isVerified
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = (event.pageIndex + 1)
      this.getRequestTaskList(this.pageNo)
    }
  }

  setTablePaginator() {
    this.requestTaskDatasource.paginator = this.paginator;
    this.requestTaskDatasource.sort = this.sort;
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = "Rows per page:";
  }

  openConfirmDsIdentityDialog(dialogTypes: string, eventName: string, isCancel: boolean) {
    // Get the email from dsrRequestDetails
    const dialogRef = this.dialog.open(ViewTypeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: dialogTypes,
        event: eventName,
        requestId: this.requestRid,
        cancelRequest: isCancel,
        extensionDetails: this.dsrRequestDetails?.extensionDetails,
        dsrRequestDetails: this.dsrRequestDetails,
        emailTemplateData: {
          ...recipientDetails(this.dsrRequestDetails)
        },
        positiveButtonLabel: "Save",
        negativeButtonLabel: "Cancel",
        displayMessage: this.tooltipMessage
      },
      panelClass: 'dialog-wrapper',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.postSuccessVerification(result, true)
      }
    });
  }

  openDataFulFillmentDialog() {
    const dialogRef = this.dialog.open(DataFufillmentDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        requestId: this.requestRid,
        emailTemplateData: {
          ...recipientDetails(this.dsrRequestDetails)
        },
        dsrRequestDetails: this.dsrRequestDetails
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.postSuccessVerification(result, true)
      }
    });
  }

  get dsVerificationDetails() {
    return this.dsrRequestDetails?.processingDetails?.verification?.dsVerificationDetails
  }

  get thirdPartyVerificationDetails() {
    return this.dsrRequestDetails?.processingDetails?.verification?.thirdPartyVerificationDetails
  }

  showRemarksOption(validationQuestion: FormGroup) {
    const validationQuestionValue = validationQuestion.getRawValue()
    const answer = validationQuestionValue.answer ? validationQuestionValue.answer.toLowerCase() : ''
    return (validationQuestionValue.optionName.includes(answer) && validationQuestionValue.shouldDisplayChildQuestion) ? true : false
  }

  clearRemarks(validationQuestion: FormGroup) {
    validationQuestion.get('remarks')?.setValue('')
  }

  viewTaskDetail(request: RequestTask, index: number) {
    const taskId = request.taskId;
    if (!taskId) {
      return
    }
    this.onViewTaskDetails.emit({ taskId: taskId, currentIndex: index, taskIds: this.requestTaskList.map((t: any) => t.taskId) })
  }

  patchRequestDeclarations() {
    if (this.stage == RequestDisplayStage.REQUEST_VALIDATION && (this.requestService.validationCompleted(this.dsrRequestDetails.stageMeta) || this.requestService.validationRejected(this.dsrRequestDetails.stageMeta))) {
      this.documentReviewed.patchValue(true);
      this.documentReviewed.disable();
    }
    else if (this.stage == RequestDisplayStage.REQUEST_FULFILLMENT && (this.requestService.dataFulfillmentCompleted(this.dsrRequestDetails.stageMeta) || this.requestService.dataFulfillmentRejected(this.dsrRequestDetails.stageMeta))) {
      this.requestFulfillmentVerified.patchValue(true);
      this.requestFulfillmentVerified.disable();
    }
  }

  setTaskListView() {
    this.selectedRightTab = RequestStageTab.TASKS
    this.setTaskTabIndex(this.selectedRightTab)
  }

  setTaskTabIndex(selectedRightTab: string) {
    this.selectedTabIndex = 0;
    if (this.stage == RequestDisplayStage.REQUEST_VERIFICATION) {
      this.selectedTabIndex = VERIFICATION_TABS.find(_tab => _tab.key == selectedRightTab)?.id ?? 0;
    }
    else if (this.stage == RequestDisplayStage.REQUEST_VALIDATION) {
      this.selectedTabIndex = VALIDATION_TABS.find(_tab => _tab.key == selectedRightTab)?.id ?? 0;
    }
    else if (this.stage == RequestDisplayStage.DATA_DISCOVERY) {
      this.selectedTabIndex = DATA_MAPPING_TABS.find(_tab => _tab.key == selectedRightTab)?.id ?? 0;
    }
    else if (this.stage == RequestDisplayStage.REQUEST_FULFILLMENT) {
      this.selectedTabIndex = FULFILLMENT_TABS.find(_tab => _tab.key == selectedRightTab)?.id ?? 0;
    }
  }

  get restrictAction(): boolean {
    return !!(this.dsrRequestDetails?.dsrDetails?.isLocked)
  }

  hideRequestInfo() {
    this.dsrRequestDetails.hideRequestInfo = true
  }

  hideImportNeeded() {
    this.dsrRequestDetails.hideImportNeeded = true
  }

  get requestInfoMessage() {
    return (this.dsrRequestDetails?.hideRequestInfo ? `` :
      (this.dsrRequestDetails?.dsrDetails?.lockType == RequestLockType.SPECIAL_DELETION ?
        requestDetailLockMessage(this.dsrRequestDetails) : ``))
  }

  setUserPermissions() {
    //Task related permisson
    this.showCreateTaskButton = this.rolePermissionService.createTaskRequest || this.rolePermissionService.fullAccessDsrRequest;
  }

  onReopenRequestClick() {
    const dialogRef = this.dialog.open(ViewTypeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        dialogType: RequestDialogTypes.REOPEN_REQUEST,
        requestId: this.requestRid,
        dialogTitle: "Request reopen",
        event: RequestAction.REOPEN_REQUEST,
        dsrRequestDetails: this.dsrRequestDetails,
        emailTemplateData: {
          ...recipientDetails(this.dsrRequestDetails)
        },
        positiveButtonLabel: "Save",
        negativeButtonLabel: "Cancel"
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onNextValidate.emit({ refreshDetail: true })
      }
    });
  }

  get taskTabIsSelected() {
    return this.selectedRightTab == RequestStageTab.TASKS
  }

  get isThirdPartyRequest() {
    return this.dsrRequestDetails?.dsrDetails?.isRequestedByThirdParty
  }

  get isAssignedRequest() {
    return (this.dsrRequestDetails?.assigneeDetails?.id)
  }

  get _tooltipMessage() {
    if (this.dsrRequestDetails?.dsrDetails?.isPaused) {
      return `By confirming identity, the timeline will be resumed`
    }
    return ``
  }

  getCategoryName(category: any[]): string {
    if (!category || category.length === 0) {
      return 'N/A';
    }
    if (category.length === 1) {
      return category[0]?.categoryName || 'N/A';
    }
    return `${category[0].categoryName} (+${category.length - 1})`;
  }

  showDetail(detailList: any[]) {
    return detailList?.length > 1 ? true : false;
  }

  showCategoryDetails(categories: any[]) {
    this.detailList = [];
    if (this.showDetail(categories)) {
      this.detailList = (categories ?? []).map(c => c.categoryName || '');
    }
  }

  getAssetPurposeName(purpose: any[]): string {
    if (!purpose || purpose.length === 0) {
      return 'N/A';
    }
    if (purpose.length === 1) {
      return purpose[0]?.purpose || 'N/A';
    }
    return `${purpose[0].purpose} (+${purpose.length - 1})`;
  }

  showPurposeDetails(purpose: any[]) {
    this.detailList = [];
    if (this.showDetail(purpose)) {
      this.detailList = (purpose ?? []).map(p => p.purpose || '');
    }
  }

  get isImportNeeded() {
    return this.dsrRequestDetails.processingDetails.dataMapping?.isImportNeeded ?? false;
  }

}
