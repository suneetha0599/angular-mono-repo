import { CommonModule, Location, NgIf } from '@angular/common';
import { Component, inject, TemplateRef, viewChild, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { RequestDetailsStagesComponent } from './request-details-stages/request-details-stages.component';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { RequestManagementService } from '@admin-core/services/request-management/request-management.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { formatStatus, recipientDetails, requestDetailLockMessage } from '../request-utils';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { CanComponentDeactivate } from '@admin-core/guards/unsaved-change.guard';
import { EMAIL_VERIFICATION, FIRST_PAGE, PAGE_SIZE, REQUEST_LEFT_DETAILS, REQUEST_STAGES, RequestDialogTypes, RequestLeftSection, RequestStageTab, RequestThrough, StageMetaData, THIRD_PARTY } from '../constant';
import { ActivityStepperDialogComponent } from '../request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { RequestClarificationComponent } from '../request-management-dialog/request-clarification/request-clarification.component';
import { DocViewerDialogComponent } from '@valura-lib/components/doc-viewer-dialog/doc-viewer-dialog.component';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { ViewTypeDialogComponent } from '../request-management-dialog/view-type-dialog/view-type-dialog.component';
import { DsrPageRequest, DsrRequestDetails, RequestDocuments, WarningMessage } from '@admin-core/models/request-management/DsrRequest';
import { AssigneeSelectionDialogComponent } from '../request-management-dialog/assignee-priority-selection-dialog/assignee-selection-dialog.component'; import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfigService } from '@admin-core/services/config.service';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, GLOBAL_DIALOG_DEFAULTS, NAVIGATION_TYPE } from '@admin-core/constants/constants';
import { UserService } from '@admin-core/services/user/user.service';
import { CountryService } from '@admin-core/services/country/country.service';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { CreateTaskDrawerComponent } from './request-details-stages/create-task-drawer/create-task-drawer.component';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

const { USER, DSRR, REQUEST_MANAGEMENT, REQUEST_DATA_SUBJECT_DETAILS, REQUEST_TASK_MANAGEMENT_DETAILS, TASK_MANAGEMENT, TASK_MANAGEMENT_DETAILS } = routeConstants
@Component({
  selector: 'app-request-management-details',
  imports: [MatButtonModule, MatIconModule, MatTabsModule, CommonModule, MatCheckboxModule, LoadingButtonComponent,
    RequestDetailsStagesComponent, FormsModule, MatFormField, MatInput, MatLabel,
    MatMenuModule, MatSelectModule, ReactiveFormsModule, MatTooltipModule, MatDrawer, MatDrawerContainer, CreateTaskDrawerComponent,
    NgModelDebounceChangeDirective, CustomMatTextareaComponent, ErrorLoadingItemsComponent],
  templateUrl: './request-management-details.component.html',
  styleUrl: './request-management-details.component.scss'
})

export class RequestManagementDetailsComponent implements CanComponentDeactivate {

  isFullscreen: boolean = false
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  dsrRequestDetails!: DsrRequestDetails
  requestRid: number = 0;
  requestStages = REQUEST_STAGES
  requestLeftTabs = REQUEST_LEFT_DETAILS
  requestLeftSection = RequestLeftSection
  currentIndex = 0;
  selectedRequestLeftIndex: number = 0;
  isTabLoading = false;
  selectedRequestLeftSection: string = this.requestLeftSection.DETAILS
  progressPercentage: number = 0;
  documentDetail!: RequestDocuments
  showUploadSection = false;
  selectedRequestStage: string = ''
  showMoreDetails = false;
  selectedStageIndex: number = -1
  currentRequestDetails = {
    requestRid: 0,
    index: 0,
  };
  currentPath: string = '';
  residency = ''
  checkboxChecked = false;
  THIRD_PARTY = THIRD_PARTY
  EMAIL = EMAIL_VERIFICATION
  StageMetaData = StageMetaData;
  requestDocuments!: RequestDocuments[]
  documentsList: any[] = []
  pageSize: number = PAGE_SIZE
  progress = 80;
  pageNo: number = FIRST_PAGE
  RequestDialogTypes = RequestDialogTypes
  countryMasterList: any = [];
  isPaused: boolean = false;
  isProcessingPauseResume: boolean = false;
  assigneeName = ''
  showSearch = false
  navigationDetails = {
    id: 0,
    key: null
  }
  showBackButton: boolean = false;
  hasApiError: boolean = false;
  editTaskData: any = null;
  isEditTaskMode: boolean = false;
  totalPages = 0;
  searchText = '';
  private previousStageIndex: number = 0;
  private previousLeftTabIndex: number = 0;
  private navigationDirection: 'prev' | 'next' | null = null;
  private tempStageIndex: number = -1;
  stageTabAnimationDuration: string = '300ms';
  private isAnimating: boolean = false;
  reverseStageAnimation: boolean = false;
  prevStageAnimation: boolean = false;
  autoAssignDsrRequest: boolean = false;

  private configService = inject(ConfigService);
  private snackbarService = inject(SnackbarService);
  private userService = inject(UserService);
  private countryService = inject(CountryService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  private cdr = inject(ChangeDetectorRef);
  private location = inject(Location);
  private rolePermissionService = inject(RolePermissionService);
  public requestService = inject(RequestManagementService);
  private apiHelperService = inject(ApiHelperService);

  @ViewChild('actionsDialog') actionsDialogTemplate!: TemplateRef<any>;
  dialogRef: MatDialogRef<any> | null = null;
  @ViewChild('escalateRequestDialog') escalateRequestDialogTemplate!: TemplateRef<any>;
  @ViewChild('createTaskDialog') createTaskDialogTemplate!: TemplateRef<any>;
  @ViewChild('docViewDialog') docViewDialogTemplate!: TemplateRef<any>;
  @ViewChild('createTaskDrawer') createTaskDrawer: any;
  @ViewChild(CreateTaskDrawerComponent) createTaskDrawerComponent!: CreateTaskDrawerComponent;
  readonly tabGroup = viewChild<MatTabGroup>('requestLeftTab');

  constructor(public dialog: MatDialog, private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.route.paramMap.subscribe({
      next: params => {
        let requestId = params.get('requestRid')
        this.requestRid = requestId ? +(requestId) : 0
        this.onInitPage()
        this.getDsrRequestsDetails()
        this.getDocumentsList(FIRST_PAGE)
      }
    });
  }

  requestItems = [
    { source: 'ABC', type: 'Internal', status: 'Completed', attributes: 27 },
    { source: 'CDE', type: 'Third party', status: 'Pending', attributes: 36 },
    { source: 'EFG', type: 'Internal', status: 'Legal', attributes: 19 },
    { source: 'HIJ', type: 'Third party', status: 'Needs review', attributes: 33 },
    { source: 'KLM', type: 'Internal', status: 'Completed', attributes: 22 },
  ];

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


  showComposeForm = false;

  composeEmail = {
    from: '',
    to: '',
    subject: '',
    body: ''
  };


  clearSearch() {
    this.searchText = '';
    this.pageNo = FIRST_PAGE;
    this.getDocumentsList(FIRST_PAGE);
  }


  onSearchChange() {
    this.searchText = this.searchText?.trimStart() || '';

    this.pageNo = FIRST_PAGE;
    this.getDocumentsList(FIRST_PAGE, this.searchText);
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      // this.prepareFilters();
    } else {
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
    }
  }
  sendEmail() {

    // Reset and hide form
    this.composeEmail = { from: '', to: '', subject: '', body: '' };
    this.showComposeForm = false;
  }

  async onLeftTabChange(index: number) {
    if (await this.checkUnsavedChangesInDrawer()) {
      setTimeout(() => {
        this.selectedRequestLeftIndex = this.previousLeftTabIndex;
      }, 0);
      return;
    }

    this.previousLeftTabIndex = index;

    this.isTabLoading = true;
    setTimeout(() => {
      this.isTabLoading = false;
    }, 600);
    this.composeEmail = { from: '', to: '', subject: '', body: '' };
    this.showComposeForm = false;
    this.showUploadSection = false;
    this.setRequestTabLeftSection(index)
  }

  setRequestTabLeftSection(index: number = 0) {
    this.selectedRequestLeftSection = (index == 1 ? this.requestLeftSection.ATTACHMENTS : (index == 2 ? this.requestLeftSection.DOCUMENTS : this.requestLeftSection.DETAILS))
  }

  onUploadClick(scrollContainer: HTMLElement): void {
    this.showUploadSection = true;
    setTimeout(() => {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  handleFileUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
  }

  composeEmails() {
    this.showComposeForm = true;
  }

  async onTabChangesInStage(tab: any, index: number) {
    if (await this.checkUnsavedChangesInDrawer()) {
      setTimeout(() => {
        this.selectedStageIndex = this.previousStageIndex;
      }, 0);
      return;
    }

    this.previousStageIndex = index;

    this.currentIndex = index;
    if (tab.selectedIndex == this.selectedStageIndex) {
      this.selectedRequestStage = this.requestStages[this.selectedStageIndex]?.key
      return
    }
    this.selectedStageIndex = index
    this.selectedRequestStage = this.requestStages[this.selectedStageIndex]?.key
  }


  private async checkUnsavedChangesInDrawer(): Promise<boolean> {
    if (!this.createTaskDrawer || !this.createTaskDrawer.opened) {
      return false;
    }

    try {
      await firstValueFrom(
        this.confirmationDialogService.showDialog(
          'Unsaved Changes',
          'You have unsaved changes that will be lost. Are you sure you want to leave the Create Task process?',
          'Yes',
          'No',
          '420px',
        )
      );
    } catch (error) {
      console.error('Error showing dialog:', error);
    }

    return true;
  }

  openAssigneeSelectionDialog(dialogType: string): void {
    const currentAssigneeId = this.dsrRequestDetails?.assigneeDetails?.id || 0;
    const currentPriority = this.dsrRequestDetails?.dsrDetails.priority || '';
    const dialogRef = this.dialog.open(AssigneeSelectionDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        requestRid: this.requestRid,
        currentAssigneeId: currentAssigneeId,
        currentPriority: currentPriority,
        dialogType
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.assigneeUpdated || result?.priorityUpdated) {
        const data = { refreshDetail: true };
        this.onNextValidate(data);
      }
    });
  }

  async getDsrRequestsDetails(showTabLoad: boolean = true) {
    if (showTabLoad) {
      this.isTabLoading = true;
    }
    this.hasApiError = false;
    const params = { isDraft: false }

    try {
      const data = await this.apiHelperService.getDsrRequestDetails(this.requestRid, params);
      if (!data) { this.hasApiError = true; return }
      if (data) {
        const dsrRequestDetails = await this.requestService.processRequestDetails({ ...data });
        this.dsrRequestDetails = dsrRequestDetails;
        const assigneeId = this.dsrRequestDetails?.assigneeDetails?.id;
        const countryId = this.dsrRequestDetails?.dsrDetails?.countryId;
        if (countryId) {
          const country = await this.countryService.getCountryById(countryId)
          this.residency = country?.name || '--';
        }
        if (assigneeId && assigneeId > 0) {
          const user = await this.userService.getUserById(assigneeId);
          this.assigneeName = user?.displayName ?? '-';
          this.dsrRequestDetails.assigneeDetails.name = (user?.displayName ?? '');
          this.dsrRequestDetails.assigneeDetails.email = (user?.email ?? '');

        } else {
          this.assigneeName = '-';
        }

        this.checkIfRequestIsPaused();
        this.setVerificationStageIndex();
      }
    }
    catch (error) {
      console.error('Error fetching BPA request details:', error);
      this.hasApiError = true;
    } finally {
      this.isTabLoading = false;
    }

  }

  openPauseDialog() {
    const dialogRef = this.dialog.open(AssigneeSelectionDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        requestRid: this.requestRid,
        currentAssigneeId: 0,
        currentPriority: '',
        dialogType: RequestDialogTypes.PAUSE_REQUEST
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.requestPaused) {

        this.getDsrRequestsDetails();
      }
    });
  }

  async resumeRequest() {
    if (this.isProcessingPauseResume) return;

    this.isProcessingPauseResume = true;
    try {
      await firstValueFrom(this.apiHelperService.resumeDsrRequest(this.requestRid));
      this.isPaused = false;
      this.snackbarService.openSnack('Request resumed successfully');


    } catch (error) {
      console.error('Error resuming request:', error);
      this.snackbarService.openSnack('Failed to resume request');
    } finally {
      this.isProcessingPauseResume = false;
    }
  }




  private checkIfRequestIsPaused() {
    this.isPaused = this.dsrRequestDetails?.dsrDetails?.isPaused || false;
  }

  getStatusText(status: string): string {
    return formatStatus(status)
  }

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: { entityId: this.requestRid, audit_log_module: AUDIT_LOG_MODULE.DSR, auditLogs: AUDIT_LOG_ENTITY_TYPE.DSR_REQUEST },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
  }

  get requestAttachmentHasValue(): boolean {
    return !!(this.requestDocuments?.length)
  }

  get requestDocumentsHasValue(): boolean {
    return !!(this.requestDocuments?.length)
  }

  onNextValidate(event: any) {
    if (event?.refreshNotes) {
      this.getDsrRequestsDetails(false)
    }
    if (event?.refreshDetail) {
      this.getDsrRequestsDetails()
    }
  }

  onEditDocumentDetails(document: RequestDocuments) {
    this.documentDetail = document
  }

  get showRequestDetailsStage() {
    return (this.dsrRequestDetails)
  }

  setVerificationStageIndex() {
    const prevSelectedStage = this.requestService.requestStage; //restore the stage after navigate back from task detail page
    if (prevSelectedStage) {
      this.requestService.deleteRequestStage()
    }

    let [key, progressBar, allStageCompleted]: any = this.requestService.getRequestVerificationStage(this.dsrRequestDetails.stageMeta, this.requestIsCompleted);
    if (prevSelectedStage) {
      key = prevSelectedStage
    }
    const nextIndex = this.requestStages.findIndex(stage => stage.key == key);
    const currentIndex = this.selectedStageIndex;

    if (this.isAnimating) {
      return;
    }

    if (this.navigationDirection) {
      this.isAnimating = true;
      this.stageTabAnimationDuration = '0ms';

      const maxIndex = this.requestStages.length - 1;
      if (this.navigationDirection === 'next') {
        if (nextIndex > 0) {
          this.selectedStageIndex = nextIndex - 1;
          this.reverseStageAnimation = false;
        } else if (maxIndex > 0) {

          this.selectedStageIndex = 1;
          this.reverseStageAnimation = true;
        } else {
          this.selectedStageIndex = nextIndex;
          this.navigationDirection = null;
          this.isAnimating = false;
          this.reverseStageAnimation = false;
          this.stageTabAnimationDuration = '0ms';
          setTimeout(() => {
            this.stageTabAnimationDuration = '300ms';
          }, 50);
          return;
        }
      }

      else if (this.navigationDirection === 'prev') {
        this.reverseStageAnimation = false;
        this.prevStageAnimation = true;
        this.selectedStageIndex = nextIndex;
      }

      this.cdr.detectChanges();

      requestAnimationFrame(() => {
        this.stageTabAnimationDuration = (this.reverseStageAnimation || this.prevStageAnimation) ? '0ms' : '300ms';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.navigationDirection = null;
          this.selectedStageIndex = nextIndex;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.isAnimating = false;
            if (this.reverseStageAnimation || this.prevStageAnimation) {
              this.stageTabAnimationDuration = '300ms';
            }
            this.reverseStageAnimation = false;
            this.prevStageAnimation = false;
          }, 350);
        }, 100);
      });
    } else {
      this.selectedStageIndex = nextIndex;
    }

    this.selectedRequestStage = key
    this.progressPercentage = +(progressBar);
    this.clearRequestStageStates()
    for (const stage of this.requestStages) {
      if (stage.key === this.selectedRequestStage) {
        stage.active = true;
      }
      const completed = this.requestService.markVerificationStage(stage.stage, this.dsrRequestDetails.stageMeta);
      stage.completed = completed;
    }
  }

  openRequestClarificationDialog() {
    this.dialogRef = this.dialog.open(RequestClarificationComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: false,
      panelClass: 'dialog-wrapper',
      data: {
        requestRid: this.requestRid,
        dsrFormId: this.requestRid,
        dsrRequestDetails: this.dsrRequestDetails
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result?.stageCompleted) {
        this.getDsrRequestsDetails(false);
      }
      if (result?.clarificationCreated || result?.clarificationUpdated) {
        this.getDsrRequestsDetails(false);
      }
    });
  }

  async onInitPage() {
    this.setUserPermissions()
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.selectedRequestLeftIndex = 0  //Reset left tab index
    this.getNavigationData()
    this.updateCurrentRequestIndex()
    await this.getInitialConfiguration()
  }

  resetRequestTabLeftSection() {
    const group = this.tabGroup();
    if (group) {
      group.selectedIndex = 0;
      this.setRequestTabLeftSection();
    }
  }

  async updateCurrentRequestIndex() {
    let requestList = this.requestService.getDsrRequestRid();
    let nodeIndex = requestList.findIndex((request: DsrPageRequest) => request.requestRid == this.requestRid);
    if (nodeIndex > -1) {
      this.currentRequestDetails.index = nodeIndex;
      await this.loadPrevRequestList();
      await this.loadNextRequestList();
    }
    this.resetRequestTabLeftSection()
  }

  async navigateToNextRequest() {
    this.navigationDirection = 'next';
    this.requestService.deleteDsrRequestRid(this.requestRid);

    const tempNextNodeRequestList = this.requestService.getNextRequestRid();
    if (this.requestService.getNextRequestShifted()) {
      this.requestService.setDsrRequestRid(tempNextNodeRequestList);
      this.currentRequestDetails.index = 0;
      this.requestService.setNextRequestShifted('false');
      this.requestService.setNextRequestPage(0, true);
    }
    let requestList = this.requestService.getDsrRequestRid();
    if (requestList?.length > 0) {
      const currentRequest = this.requestService.getNextOrPrevRequestRid(
        this.currentRequestDetails.index
      );
      if (currentRequest) {
        this.openNextRequest(currentRequest.id);
        return
      }
      if (this.getPrevRequestRid) {
        this.navigationDirection = 'prev';
        this.goToPrevRequest()
        return;
      }
      return
    }

    if (this.getPrevRequestRid) {
      this.navigationDirection = 'prev';
      this.goToPrevRequest()
      return
    }
    this.router.navigate([`${USER}/${DSRR}/${REQUEST_MANAGEMENT}`])
  }

  openNextRequest(requestRid: number) {
    this.router.navigate([`${this.currentPath}/${requestRid}`])
  }

  async goToPrevRequest() {
    this.currentRequestDetails.index--;
    this.navigationDirection = 'prev';

    if (this.requestService.getPrevRequestShifted()) {
      const tempRequestList = this.requestService.getPrevRequestRid();
      this.requestService.setDsrRequestRid(tempRequestList);
      const currentRequestSize = this.requestService.getDsrRequestRid()?.length ?? 0;
      this.currentRequestDetails.index = currentRequestSize - 1;
      this.requestService.setPrevRequestShifted('false');
      this.requestService.setPrevRequestPage(0, true);
    }
    const currentRequest = this.requestService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.requestRid);
    }
  }

  async goToNextRequest() {
    this.currentRequestDetails.index++;
    this.navigationDirection = 'next';

    if (this.requestService.getNextRequestShifted()) {
      const tempNextRequestList = this.requestService.getNextRequestRid();
      this.requestService.setDsrRequestRid(tempNextRequestList);
      this.currentRequestDetails.index = 0;
      this.requestService.setNextRequestShifted('false');
      this.requestService.setNextRequestPage(0, true);
    }
    const currentRequest = this.requestService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.requestRid);
    }
  }

  get disablePrevBtn() {
    return this.requestService.getPrevRequestRid()?.length == 0;
  }

  get getPrevRequestRid() {
    return this.requestService.getPrevRequestRid()?.length;
  }

  get disableNextBtn() {
    return this.requestService.getNextRequestRid()?.length == 0;
  }

  async loadPrevRequestList() {
    const tempRequestList = this.requestService.getDsrRequestRid();

    if (this.currentRequestDetails.index == 0) {
      let pageData = this.requestService.getNextRequestPageNo(true);
      if (pageData?.exceeded) {
        this.requestService.removePrevRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.requestService.setPrevRequestPage(newPageNo);
      const requestList: DsrPageRequest[] = await this.requestService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.requestService.setPrevRequestShifted('true');
        this.requestService.setPrevRequestRid(requestList);
        return;
      }
    }

    this.requestService.setPrevRequestRid(tempRequestList);
    this.requestService.setPrevRequestShifted('false');
  }

  async loadNextRequestList() {
    const tempRequestList = this.requestService.getDsrRequestRid();

    const currentSize = this.requestService.getDsrRequestRid()?.length ?? 0;
    if (currentSize - this.currentRequestDetails.index == 1) {
      let pageData = this.requestService.getNextRequestPageNo();
      if (pageData?.exceeded) {
        this.requestService.removeNextRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.requestService.setNextRequestPage(newPageNo);
      const requestList: DsrPageRequest[] = await this.requestService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.requestService.setNextRequestShifted('true');
        this.requestService.setNextRequestRid(requestList);
        return;
      }
    }

    this.requestService.setNextRequestRid(tempRequestList);
    this.requestService.setNextRequestShifted('false');
  }

  openDataSubjectDetails() {
    const requesterName =
      this.router.navigate([`${USER}/${DSRR}/${REQUEST_MANAGEMENT}/${REQUEST_DATA_SUBJECT_DETAILS}`], {
        queryParams: {
          requestRid: this.requestRid,
          requesterName: this.firstPartyFullName,
          requesterEmail: this.dsrRequestDetails.dsrDetails.firstPartyEmail
        }
      });

  }

  onToggleFullScreen(event: any) {
    this.isFullscreen = event.isFullscreen
  }

  async viewAttachment(attachment: RequestDocuments) {
    if (attachment.loading) {
      return
    }
    attachment.loading = true
    await this.viewDocument(attachment.url, attachment.name);
    attachment.loading = false
  }

  async viewRequestDocument(document: RequestDocuments) {
    if (document.loading) {
      return
    }
    document.loading = true
    await this.viewDocument(document.url, document.name);
    document.loading = false
  }

  async viewDocument(file: any, fileName: string) {
    const params = {
      "fileKey": file,
    }
    let imageInfo = await this.apiHelperService.getPresignedUrl(params);
    if (imageInfo?.presignedUrl) {
      const dialogRef = this.dialog.open(DocViewerDialogComponent, {
        data: {
          doc: imageInfo.presignedUrl,
          fileName: this.getFileName(fileName) || '',
          requestRid: this.requestRid,
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
        if (result?.documentVerified) {
          const data = { refreshDetail: true }
          this.onNextValidate(data)
        }
      });
    }

    else {
      console.error('Failed to get presigned URL');
    }
  }

  stageDisabled(stage: any): boolean {
    return (stage.completed || stage.active) ? false : true
  }

  clearRequestStageStates() {
    for (const stage of this.requestStages) {
      stage.active = false;
      stage.completed = 0;
    }
  }

  openEscalateRequestDialog() {
    const dialogRef = this.dialog.open(ViewTypeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: RequestDialogTypes.ESCALATE_REQUEST, requestId: this.requestRid,
        dialogTitle: "Escalate Request", positiveButtonLabel: "Apply", negativeButtonLabel: "Cancel",
        dsrRequestDetails: this.dsrRequestDetails,
        emailTemplateData: {
          ...recipientDetails(this.dsrRequestDetails)
        },
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.requesEscalated) {
        const data = { refreshDetail: true }
        this.onNextValidate(data)
      }
    });
  }

  openExtendPeriodDialog() {

    const dialogRef = this.dialog.open(ViewTypeDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: RequestDialogTypes.EXTEND_PERIOD,
        requestId: this.requestRid,
        dialogTitle: "Deadline Extension",
        positiveButtonLabel: "Submit",
        dsrRequestDetails: this.dsrRequestDetails,
        extensionDetails: this.dsrRequestDetails.extensionDetails,
        negativeButtonLabel: "Cancel",
        emailTemplateData: {
          ...recipientDetails(this.dsrRequestDetails)
        },
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.periodExtended) {
        this.getDsrRequestsDetails();
      }
    });
  }

  get isEmailVerification() {
    return this.hasFormUserDetails ? (this.dsrRequestDetails.dsrFormRequestedUserDetails?.pidType == EMAIL_VERIFICATION ? "Email" : "Phone number") : ''
  }

  get hasFormUserDetails() {
    return this.dsrRequestDetails.dsrFormRequestedUserDetails?.pidType ? true : false
  }

  get pId() {
    return this.dsrRequestDetails?.dsrFormRequestedUserDetails?.pid ? (this.dsrRequestDetails.dsrFormRequestedUserDetails.pid) : "---"
  }

  get requestType() {
    return this.dsrRequestDetails.dsrDetails.isRequestedByThirdParty ? "Third party" : "Self"
  }


  async getDocumentsList(pageNo: number = this.pageNo, searchQuery: string = this.searchText) {

    const params: any = {
      page: pageNo,
      size: this.pageSize
    };
    if (searchQuery) {
      params.searchQuery = searchQuery;
    }

    try {
      const data = await this.apiHelperService.getDocumentList(this.requestRid, params);

      if (data) {
        if (pageNo === FIRST_PAGE) {
          this.requestDocuments = data.documents ?? [];
          this.documentsList = data.documents ? data.documents.map((doc: any) => ({
            id: doc.id.toString(),
            name: doc.name.split('/').pop() || doc.name,
            fullPath: doc.name
          })) : [];
        } else {
          this.requestDocuments = [...this.requestDocuments, ...(data.documents ?? [])];
          const newDocuments = data.documents ? data.documents.map((doc: any) => ({
            id: doc.id.toString(),
            name: doc.name.split('/').pop() || doc.name,
            fullPath: doc.name
          })) : [];
          this.documentsList = [...this.documentsList, ...newDocuments];
        }

        this.pageNo = pageNo;
        this.totalPages = data.totalPages;
      }
    } finally {
      setTimeout(() => (this.isTabLoading = false), 300);
    }
  }

  onScroll(e: Event) {
    const target = e.target as HTMLElement;
    const bottomReached = target.scrollHeight - target.scrollTop <= target.clientHeight;

    if (bottomReached && !this.isTabLoading && this.pageNo < this.totalPages) {
      this.getDocumentsList(this.pageNo + 1, this.searchText);
    }
  }

  getShortFileName(fullPath: string): string {
    if (!fullPath) return '';
    const filename = fullPath.split('/').pop() || '';
    const parts = filename.split('_');
    return parts.length > 2 ? parts.slice(0, 2).join('_') + '...' : filename;
  }

  async getInitialConfiguration() {
    const res = await this.configService.getDsrConfiguration();
    if (res) {
      this.countryMasterList = res.countryList || [];
    }

    return;
  }

  onViewTaskDetails(event: any) {
    this.requestService.setRequestStage(this.selectedRequestStage)
    const taskId = `${event.taskId}`
    this.router.navigate([`${USER}/${DSRR}/${REQUEST_MANAGEMENT}/${REQUEST_TASK_MANAGEMENT_DETAILS}/${taskId}`], {
      state: { bpaIds: event.taskIds, currentIndex: event.index, fromCollectionPoint: true }
    })
  }

  get showRequestResumeAndPauseAction() {
    return this.dsrRequestDetails?.dsrDetails?.requestResolutionDate ? (this.dsrRequestDetails?.stageMeta?.verification == StageMetaData.CURRENT_STAGE) : false
  }

  get requestIsFulfilled() {
    if (!this.dsrRequestDetails?.stageMeta) {
      return false
    }
    return this.requestService.dataFulfillmentCompleted(this.dsrRequestDetails.stageMeta) || this.requestService.dataFulfillmentRejected(this.dsrRequestDetails.stageMeta)
  }

  hideWarningMessage(warningMessage: WarningMessage) {
    warningMessage.hideMessage = true
  }

  get requestIsCompleted() {
    return this.dsrRequestDetails?.requestCompleted
  }

  stageIsCompleted(stage: any) {
    return (stage.completed == StageMetaData.COMPLETED || stage.completed == StageMetaData.REJECTED)
  }

  getFileName(fileKey: string): string {
    if (!fileKey) return '';
    const parts = fileKey.split('/');
    return parts[parts.length - 1];
  }

  isTruncated(element: HTMLElement): boolean {
    if (!element) return false;
    return element.offsetWidth < element.scrollWidth;
  }

  get requestIsLocked() {
    return this.dsrRequestDetails?.dsrDetails?.isLocked
  }

  get requestLockMessage() {
    return requestDetailLockMessage(this.dsrRequestDetails)
  }

  get restrictAction(): boolean {
    return (this.isRequestIsLocked || this.requestIsCompleted)
  }

  get isRequestIsLocked(): boolean {
    return !!(this.dsrRequestDetails?.dsrDetails?.isLocked)
  }

  get resumeTooltip() {
    return this.isRequestIsLocked ? '' : (this.requestIsCompleted ? 'Request completed' : (this.isPaused ? 'Resume Request' : 'Pause Timeline'))
  }

  get showExtendButton() {
    if (this.requestIsFulfilled || this.restrictAction) {
      return false;
    }
    const remainingDays = this.dsrRequestDetails?.extensionDetails?.remainingExtensionDays;
    return remainingDays === undefined || remainingDays > 0;
  }

  get firstPartyFullName() {
    return `${this.dsrRequestDetails?.dsrDetails?.firstPartyFirstName ? `${this.dsrRequestDetails.dsrDetails.firstPartyFirstName} ${this.dsrRequestDetails.dsrDetails.firstPartyLastName ? this.dsrRequestDetails.dsrDetails.firstPartyLastName : ``}` : ``}`;
  }

  get thirdPartyFullName() {
    return `${this.dsrRequestDetails?.dsrDetails?.thirdPartyFirstName ? `${this.dsrRequestDetails.dsrDetails.thirdPartyFirstName} ${this.dsrRequestDetails.dsrDetails.thirdPartyLastName ? this.dsrRequestDetails.dsrDetails.thirdPartyLastName : ``}` : ``}`;
  }

  onOpenCreateTaskDrawer() {
    if (this.createTaskDrawer) {
      this.createTaskDrawer.open();
      setTimeout(() => {
        this.createTaskDrawerComponent?.onDrawerOpened();
      }, 0);
    }
  }

  onOpenEditTaskDrawer(taskData: any) {
    this.editTaskData = taskData;
    this.isEditTaskMode = true;
    if (this.createTaskDrawer) {
      this.createTaskDrawer.open();
      setTimeout(() => {
        this.createTaskDrawerComponent?.onDrawerOpened();
      }, 0);
    }
  }

  closeTaskDrawer() {
    this.editTaskData = null;
    this.isEditTaskMode = false;
    if (this.createTaskDrawer) {
      this.createTaskDrawer.close();
    }
  }

  onTaskCreated(event: any) {
    this.closeTaskDrawer();
    this.onNextValidate({ refreshDetail: true })
    this.requestService.setRouteBack(RequestStageTab.TASKS)
  }


  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (this.createTaskDrawer && this.createTaskDrawer.opened) {
      return firstValueFrom(
        this.confirmationDialogService.showDialog(
          'Unsaved Changes',
          'You have unsaved changes that will be lost. Are you sure you want to leave the Create Task process?',
          'Yes',
          'No',
          '420px',
        )
      ).then(() => {
        return false;
      }).catch(() => {
        return false;
      });
    }

    return true;
  }

  get requestThrough() {
    return this.dsrRequestDetails?.dsrDetails?.isRequestedByThirdParty ? `${RequestThrough.THIRD_PARTY}` : `${RequestThrough.SELF}`;
  }

  getNavigationData() {
    const state = history.state
    this.navigationDetails = {
      key: state?.key ?? null,
      id: +(state?.id ?? 0)
    }
    if (this.navigationDetails?.key) {
      this.showBackButton = true
    }
  }

  goBack(): void {
    const id = this.navigationDetails.id;
    if (this.navigationDetails.key == NAVIGATION_TYPE.TASK_DETAIL && id) {
      this.router.navigate([`${USER}/${DSRR}/${TASK_MANAGEMENT}/${TASK_MANAGEMENT_DETAILS}/${id}`],)
      return
    }
    this.location.back();
  }

  setUserPermissions() {
    this.autoAssignDsrRequest = this.rolePermissionService.autoAssignDsrRequest || this.rolePermissionService.fullAccessDsrRequest;
  }

}
