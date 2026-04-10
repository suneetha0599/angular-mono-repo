import { Component, inject, EventEmitter, Output, ViewChild, Input, OnDestroy, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { RiskMitigationTabScreenComponent } from '@admin-page/data-discovery/bpa-listing/risk-mitigation-tab-screen/risk-mitigation-tab-screen.component';
import { RiskMitigationDrawerComponent } from '@admin-page/data-discovery/bpa-listing/risk-mitigation-drawer/risk-mitigation-drawer.component';
import { MatDialog } from '@angular/material/dialog';
import { RiskDialogComponent } from '@admin-page/data-discovery/bpa-listing/create-bpa/risk-summary-screen/risk-dialog/risk-dialog.component';
import { ApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { AssessmentData, TemplateDetail } from '../assignment-model';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
import { AUDIT_LOG_MODULE, AUDIT_LOG_ENTITY_TYPE, NOTIFICATION_MESSAGE_TYPE } from '@admin-core/constants/constants';
import { CREATE_TEMPLATE, CREATE_VENDOR_TEMPLATE, REQUEST_JUSTIFICATION } from '@admin-core/constants/api-constants';
import { Subscription, filter, take } from 'rxjs';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SecurityControlService } from '@admin-core/services/security-control/security-control.service';
import { APPROVAL_TAB_HEADER_DETAILS, AssessemntSource, AssessmentDetailsKey, AssessmentStatus, DETAILS, OTHER_TAB_HEADER_DETAILS, QUESTION_AND_RESPONSE, RISK_AND_MEASURES, TAB_HEADER_DETAILS, TASKS } from '../constants';
import { MatTooltipModule } from '@angular/material/tooltip';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { AssessmentTaskListComponent } from '../assessment-task-list/assessment-task-list.component';
import { AssessmentRiskListComponent } from '../assessment-risk-list/assessment-risk-list.component';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { RiskDrawerService, RiskDrawerPayload } from '@admin-core/services/risk-drawer/risk-drawer.service';
import { RiskViewDrawerService, RiskViewPayload, RiskTaskPayload } from '@admin-core/services/risk-view-drawer/risk-view-drawer.service';
import { CreateRiskDrawerComponent } from '../assessment-risk-list/create-risk-drawer/create-risk-drawer.component';
import { RiskViewDrawerComponent } from '../assessment-risk-list/risk-view-drawer/risk-view-drawer.component';
import { CreateTaskDrawerComponent } from '@admin-page/request-management/request-management-details/request-details-stages/create-task-drawer/create-task-drawer.component';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { GLOBAL_DIALOG_DEFAULTS } from '../../../../core/constants/constants';
import { CreateTaskDialogComponent } from '@admin-page/request-management/request-management-dialog/create-task-dialog/create-task-dialog.component';
import { RequestDialogTypes } from '@admin-page/request-management/constant';
import { ErrorLoadingItemsComponent } from '@valura-lib/components/error-loading-items/error-loading-items.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { StatusUpdateDialogComponent } from '../../templates/status-update-dialog/status-update-dialog.component';
import { AssessmentDetailsComponent } from "./assessment-details/assessment-details.component";
import { AssessmentApproversComponent } from '../assessment-approvers/assessment-approvers.component';
import { AssessmentActivityComponent } from '../assessment-activity/assessment-activity.component';
import { QuestionAndResponseComponent } from '../question-and-response/question-and-response.component';
import { AssessmentDiscussionLogComponent, DiscussionLogNavigationTarget } from '../assessment-discussion-log/assessment-discussion-log.component';
import { RelatedInformationComponent } from "./related-information/related-information.component";
import { TriggerDetailDrawerComponent } from "./trigger-detail-drawer/trigger-detail-drawer.component";
import { AssessmentExternalRespondentComponent } from '../../assessment-external-respondent/assessment-external-respondent.component';
import { SseService } from '@valura-lib/service/sse//sse.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-assessment-overview',
  imports: [CommonModule, FormsModule, MatCardModule, MatTabsModule, MatIconModule, MatFormFieldModule, MatInputModule, RiskMitigationDrawerComponent, MatDrawer, MatDrawerContainer, MatTooltipModule, ErrorLoadingItemsComponent, MatTableModule, AssessmentDetailsComponent,
    AssessmentApproversComponent, AssessmentActivityComponent, QuestionAndResponseComponent, AssessmentDiscussionLogComponent, RelatedInformationComponent, TriggerDetailDrawerComponent, RiskMitigationDrawerComponent, AssessmentRiskListComponent,
    AssessmentTaskListComponent, CreateRiskDrawerComponent, RiskViewDrawerComponent, CreateTaskDrawerComponent, AssessmentExternalRespondentComponent
  ],
  templateUrl: './assessment-overview.component.html',
  styleUrl: './assessment-overview.component.scss'
})
export class AssessmentOverviewComponent {
  openLink() {
    throw new Error('Method not implemented.');
  }

  onClickRegulation() {
    throw new Error('Method not implemented.');
  }
  drawerType: 'risk' | 'trigger' | null = null;
  @Output() query = new EventEmitter<any>();
  @ViewChild(RiskMitigationTabScreenComponent) riskTab!: RiskMitigationTabScreenComponent;
  @ViewChild(AssessmentTaskListComponent) taskListComponent!: AssessmentTaskListComponent;
  @ViewChild(AssessmentRiskListComponent) riskListComponent!: AssessmentRiskListComponent;

  @ViewChild('assessmentRiskViewDrawer') assessmentRiskViewDrawer!: MatDrawer;
  @ViewChild('assessmentRiskViewDrawer', { read: ElementRef }) assessmentRiskViewDrawerEl!: ElementRef;
  @ViewChild(RiskViewDrawerComponent) riskViewDrawerComponent!: RiskViewDrawerComponent;

  @ViewChild('assessmentRiskDrawer') assessmentRiskDrawer!: MatDrawer;
  @ViewChild('assessmentRiskDrawer', { read: ElementRef }) assessmentRiskDrawerEl!: ElementRef;
  @ViewChild(CreateRiskDrawerComponent) createRiskDrawerComponent!: CreateRiskDrawerComponent;

  @ViewChild('assessmentCreateTaskDrawer') assessmentCreateTaskDrawer!: MatDrawer;
  @ViewChild('assessmentCreateTaskDrawer', { read: ElementRef }) assessmentCreateTaskDrawerEl!: ElementRef;
  @ViewChild(CreateTaskDrawerComponent) createTaskDrawerComponent!: CreateTaskDrawerComponent;

  riskDrawerPayload: RiskDrawerPayload = { assessmentId: 0, sections: [], editData: null, isEditMode: false };
  riskViewData: any = null;
  riskViewPayload: RiskViewPayload | null = null;
  private _riskViewPayloadBeforeEdit: RiskViewPayload | null = null;
  private _riskViewPayloadBeforeTaskCreate: RiskViewPayload | null = null;
  createTaskRiskData: RiskTaskPayload | null = null;

  private riskDrawerService = inject(RiskDrawerService);
  private riskViewDrawerService = inject(RiskViewDrawerService);
  private riskSavedSub = new Subscription();


  readonly EDITED = 'EDITED';
  selectedTabIndex = 0;
  selectedTab: string = TAB_HEADER_DETAILS[0].key
  assessmentData: AssessmentData | null = null;
  pendingQrSectionId: number | null = null;
  pendingQrQuestionId: number | null = null;
  element: any;
  link = 'https://linkhere.com';

  tabHeaderDetails = TAB_HEADER_DETAILS
  RESPONDED: string = 'RESPONDED';
  JUSTIFIED: string = 'JUSTIFIED';
  ACCEPTED: string = 'ACCEPTED';
  CHECK_BOX: string = 'CHECK_BOX';
  FILE_UPLOAD: string = 'FILE_UPLOAD';
  isLoading = false;
  assessmentId: number = 0
  assessments: any[] = [];
  assessmentLoading: boolean = false;
  AssessmentDetailsKey = AssessmentDetailsKey
  respondentDataSource = new MatTableDataSource<any>([]);
  approverDataSource = new MatTableDataSource<any>([]);
  previousTabIndex: number | null = null;
  private _activeTabIndex: number = 0;

  pendingTaskId: number | null = null;
  pendingMessageId: number | null = null;
  pendingSection: string | null = null;
  displayedHeaders = ['name', 'userType'];
  approverDisplayedHeaders = ['level', 'totalApprovers', 'name'];
  qrFocusTarget: DiscussionLogNavigationTarget | null = null;
  riskChartData = [
    { value: 12, name: 'High' },
    { value: 8, name: 'Medium' },
    { value: 5, name: 'Low' }
  ];

  taskProgressData = [
    { value: 91, name: 'Completed' },
    { value: 9, name: 'Pending' }
  ];

  questionData = [
    { value: 90, name: 'Answered' },
    { value: 10, name: 'Pending' },

  ];

  questionColors = ['#1C2B70', '#F3F4F6',];
  lineChartColors = ['#D7F049', '#1C2B70', '#FF6592']
  dailyProgressData = {
    categories: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ],
    series: [
      {
        name: 'Questions Answered',
        data: [20, 40, 35, 50, 60, 45, 30]
      },
      {
        name: 'Risks Identified',
        data: [5, 8, 6, 10, 12, 7, 4]
      },
      {
        name: 'Tasks Raised',
        data: [10, 18, 15, 22, 25, 17, 9]
      }
    ]
  };
  taskColors = ['#D7F049', '#F3F4F6'];
  statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: '#FFC7C2' },
    RESPONDED: { label: 'Responded', color: '#CDF4D3' },
    JUSTIFICATION_NEEDED: { label: 'Need clarification', color: '#FFECBD' },
    JUSTIFIED: { label: 'Clarified', color: '#FFECBD' },
    ACCEPTED: { label: 'Approved', color: '#CDF4D3' },
    EDITED: { label: 'Edited', color: '#CDF4D3' }
  };
  isAcceptResponse: boolean = false;
  isRejectJustification: boolean = false;
  isRaiserisk: boolean = false;
  securityControlList: any[] = [];
  securityControlForm!: FormGroup;
  drawerMode: { mode: 'ADD' | 'VIEW', data?: any } = { mode: 'ADD' };
  selectedRisk: any = null;
  DETAILS = DETAILS
  TASKS = TASKS
  RISK_AND_MEASURES = RISK_AND_MEASURES
  QUESTION_AND_RESPONSE = QUESTION_AND_RESPONSE
  currentPath = ''
  showBackButton = false
  private returnToTab: string | null = null
  templateDetails: TemplateDetail | any
  currentAssessmentDetails = {
    assessmentRid: 0,
    index: 0
  };
  private navigationDirection: 'prev' | 'next' | null = null;
  hasApiError: boolean = false;
  assessmentSource: string = AssessemntSource.GENERAL
  userCanDoSubmitAssessment: boolean = false;
  externalRespondentLoaded: boolean = false;
  private sseSubscription!: Subscription;
  forceRefresh: boolean = false;

  private securityControlService = inject(SecurityControlService);
  private assessmentService = inject(AssessmentService);
  private sseService = inject(SseService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);

  @ViewChild('rightDrawer') rightDrawer!: MatDrawer;
  constructor(
    private snackbarService: SnackbarService,
    private route: ActivatedRoute,
    private router: Router,
    private apiHelperService: ApiHelperService,
    private httpService: HttpService,
    private dialog: MatDialog) {
    this.assessmentService.isLoading$.subscribe(res => {
      this.assessmentLoading = res ? true : false;
    });
  }

  ngOnInit() {
    if (this.router.url.includes(routeConstants.VENDORS)) {
      this.assessmentSource = AssessemntSource.VENDOR;
    }
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.route.queryParams.subscribe(params => {
      this.showBackButton = params['viewDetails'] === 'true';
      this.returnToTab = params['returnTo'] || null;

      if (params['tab'] === AssessmentDetailsKey.TASKS || params['section'] === AssessmentDetailsKey.TASKS || params['section'] === 'TASK') {
        this.pendingSection = AssessmentDetailsKey.TASKS;
        const taskId = +params['taskId'] || +params['conversationEntityId'];
        const conversationId = +params['conversationId'];
        if (taskId) {
          this.pendingTaskId = taskId;
          this.pendingMessageId = conversationId || null;
        }
        setTimeout(() => {
          this.goToTasksTab();
          setTimeout(() => {
            this.pendingTaskId = null;
            this.pendingMessageId = null;
            this.pendingSection = null;
          }, 3000);
        }, 500);
        this.router.navigate([], { queryParams: { tab: null, section: null, taskId: null, conversationEntityId: null, conversationId: null }, queryParamsHandling: 'merge', replaceUrl: true });
      }
      if (params['tab'] === 'QR') {
        const sectionId = +params['sectionId'];
        const questionId = +params['questionId'];
        if (sectionId && questionId) {
          this.pendingQrSectionId = sectionId;
          this.pendingQrQuestionId = questionId;
          this.pendingSection = AssessmentDetailsKey.QUESTION_AND_RESPONSE;

          const qrIdx = this.tabHeaderDetails.findIndex(
            tab => tab.key === AssessmentDetailsKey.QUESTION_AND_RESPONSE
          );
          if (qrIdx !== -1) this.selectedTabIndex = qrIdx;
          this.router.navigate([], {
            queryParams: { tab: null, sectionId: null, questionId: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }
      }
      if (params['section'] === AssessmentDetailsKey.QUESTION_AND_RESPONSE) {
        const sectionId = +params['conversationParentEntityId'];
        const questionId = +params['conversationEntityId'];
        const messageId = +params['conversationId'];

        if (sectionId && questionId && messageId) {
          setTimeout(() => {
            this.qrFocusTarget = {
              sectionId,
              questionId,
              messageId,
              parentId: messageId,
              conversationPage: 0,
              childCount: 1
            };
            const qrIdx = this.tabHeaderDetails.findIndex(
              tab => tab.key === AssessmentDetailsKey.QUESTION_AND_RESPONSE
            );
            if (qrIdx !== -1) this.selectedTabIndex = qrIdx;
          }, 300);

          this.router.navigate([], {
            queryParams: {
              section: null,
              conversationParentEntityId: null,
              conversationEntityId: null,
              conversationId: null
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }
        else {
          this.pendingSection = AssessmentDetailsKey.QUESTION_AND_RESPONSE;
        }
      }
    });
    this.route.params.subscribe(params => {
      this.assessmentId = +params['id'];
      if (this.assessmentId) {
        this.externalRespondentLoaded = false;
        this.loadAssessmentDetails(this.assessmentId);
      } else {
        this.snackbarService.openSnack('Assessment ID not found in URL');
      }
    });
    this.getSecurityControlList();
    this.onInitPage();
    this.riskSavedSub.add(this.riskDrawerService.saved$.subscribe(event => {
      if (event.source === 'QUESTION_AND_RESPONSE') {
        this.loadAssessmentDetails(this.assessmentId).then(() => {
          setTimeout(() => this.goToRiskTab(), 250);
        });
      } else if (event.source === 'RISK_VIEW_EDIT') {
        const payload = this._riskViewPayloadBeforeEdit;
        this._riskViewPayloadBeforeEdit = null;
        if (payload) {
          this.assessmentRiskDrawer.closedStart.pipe(take(1)).subscribe(() => {
            setTimeout(() => this.riskViewDrawerService.open(payload), 420);
          });
        }
      }
    }));

    this.riskSavedSub.add(this.riskViewDrawerService.taskSaved$.subscribe(event => {
      if (event.source === 'QUESTION_AND_RESPONSE' || event.source === 'RISK_CREATE_TASK' || event.source === 'RISK_VIEW_DRAWER') {
        this.loadAssessmentDetails(this.assessmentId).then(() => {
          setTimeout(() => this.goToTasksTab(), 250);
        });
      }
    }));

    this.riskSavedSub.add(
      this.riskDrawerService.open$.subscribe(payload => {
        this.riskDrawerPayload = payload;
        this.assessmentRiskDrawer.open();
        setTimeout(() => {
          const el = this.assessmentRiskDrawerEl?.nativeElement as HTMLElement;
          if (el) {
            el.style.setProperty('width', '50vw', 'important');
            el.style.setProperty('min-width', '50vw', 'important');
            el.style.setProperty('max-width', '50vw', 'important');
            el.style.setProperty('height', '100vh', 'important');
          }
          this.createRiskDrawerComponent?.onDrawerOpened();
        }, 0);
      })
    );
    this.riskSavedSub.add(
      this.riskDrawerService.close$.subscribe(() => this.assessmentRiskDrawer?.close())
    );

    this.riskSavedSub.add(
      this.riskViewDrawerService.open$.subscribe((payload: RiskViewPayload) => {
        this.riskViewData = payload.riskData;
        this.riskViewPayload = payload;
        this.assessmentRiskViewDrawer.open();
        setTimeout(() => {
          const el = this.assessmentRiskViewDrawerEl?.nativeElement as HTMLElement;
          if (el) {
            el.style.setProperty('width', '50vw', 'important');
            el.style.setProperty('min-width', '50vw', 'important');
            el.style.setProperty('max-width', '50vw', 'important');
            el.style.setProperty('height', '100vh', 'important');
          }
          this.riskViewDrawerComponent?.onDrawerOpened();
        }, 0);
      })
    );
    this.riskSavedSub.add(
      this.riskViewDrawerService.close$.subscribe(() => this.assessmentRiskViewDrawer?.close())
    );

    this.riskSavedSub.add(
      this.riskViewDrawerService.createTask$.subscribe((payload: RiskTaskPayload) => {
        this.createTaskRiskData = payload;

        const openTaskDrawer = () => {
          this.assessmentCreateTaskDrawer?.open();
          setTimeout(() => {
            const el = this.assessmentCreateTaskDrawerEl?.nativeElement as HTMLElement;
            if (el) {
              el.style.setProperty('width', '62vw', 'important');
              el.style.setProperty('min-width', '62vw', 'important');
              el.style.setProperty('max-width', '62vw', 'important');
              el.style.setProperty('height', '100vh', 'important');
            }
            this.createTaskDrawerComponent?.onDrawerOpened();
          }, 0);
        };

        if (this.assessmentRiskViewDrawer?.opened) {
          this._riskViewPayloadBeforeTaskCreate = this.riskViewPayload;
          this.assessmentRiskViewDrawer.closedStart.pipe(take(1)).subscribe(() => {
            setTimeout(() => openTaskDrawer(), 420);
          });
          this.assessmentRiskViewDrawer.close();
        } else {
          openTaskDrawer();
        }
      })
    );

    this.riskSavedSub.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationStart))
        .subscribe(() => {
          this.assessmentRiskDrawer?.close();
          this.assessmentRiskViewDrawer?.close();
          this.assessmentCreateTaskDrawer?.close();
          this.createTaskRiskData = null;
        })
    );
  }

  ngOnDestroy(): void {
    this.riskSavedSub.unsubscribe();
    this.sseSubscription?.unsubscribe();
  }

  async onInitPage() {
    this.updateCurrentRequestIndex();
    this.sseSubscription = this.sseService.connect(environment.sseApi)
      .subscribe(event => {
        this.handleSseEvent(event);
      });
  }


  goBack() {
    if (this.previousTabIndex !== null) {
      this.selectedTabIndex = this.previousTabIndex;
      this.showBackButton = false;
      this.previousTabIndex = null;
    } else if (this.returnToTab === 'TASKS') {
      const tabIndex = this.tabHeaderDetails.findIndex(
        tab => tab.key === AssessmentDetailsKey.TASKS
      );
      if (tabIndex !== -1) {
        this.selectedTabIndex = tabIndex;
      }
      this.showBackButton = false;
      this.returnToTab = null;
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    } else {
      window.history.back();
    }
  }


  async getSecurityControlList(): Promise<void> {
    try {
      const securityControlList = await this.securityControlService.getSecurityControlMasterList()
      if (securityControlList) {
        this.securityControlList = securityControlList || [];
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  approverLevels: any[] = [];
  isApprovers: boolean = false;
  isAuthor: boolean = false;

  async onRefreshApprovers() {
    this.externalRespondentLoaded = false;
    this.loadAssessmentDetails(this.assessmentId);
  }

  async loadAssessmentDetails(assessmentId: number) {
    this.isLoading = true;
    this.hasApiError = false;
    let res;
    try {
      res = await this.apiHelperService.getAssessmentDetail(assessmentId);
      if (!res) { this.hasApiError = true; return }
      this.assessmentData = res;
      this.onPostAssessemntDetail();
    } catch (error) {
      console.error('Error loading assessment:', error);
      this.hasApiError = true
    } finally {
      this.isLoading = false;
    }
  }

  async onPostAssessemntDetail() {
    if (this.assessmentData) {
      this.approverLevels = this.assessmentData.approverDetails;
      this.isApprovers = this.assessmentData.isApprover;
      this.isAuthor = this.assessmentData.isAuthor;
      this.forceRefresh = false;
      this.setQuestionAndResponseTabDetails();
      this.setTabHeaders();
      const { _assessmentData, _assessmentDetail } = await this.assessmentService.prepareAssessmentDetail(this.assessmentData);
      this.assessmentData = { ..._assessmentData };
      this.element = { ..._assessmentDetail };
      const respondents = _assessmentData.respondentDetails || [];
      this.respondentDataSource.data = respondents.map((item: any) => ({
        name: item?.respondent?.displayName || item?.respondent?.email || `User ${item?.respondent?.userId}`,
        userType: item?.respondent?.userType
      }));
      const lastRespondent = respondents[respondents.length - 1]?.respondent;
      if (lastRespondent) {
        this.assessmentService.currentRespondentUser = lastRespondent;
      }
      const approvers = this.assessmentData?.approverDetails || [];
      const groupedByLevel = approvers.reduce((acc: any, curr: any) => {
        const level = curr.level;
        if (!acc[level]) {
          acc[level] = [];
        }
        acc[level].push(curr);
        return acc;
      }, {});
      this.approverDataSource.data = Object.keys(groupedByLevel)
        .sort((a, b) => Number(a) - Number(b))
        .map(level => {
          const levelApprovers = groupedByLevel[level];
          return {
            level: Number(level),
            totalApprovers: levelApprovers.length,
            names: levelApprovers.map((item: any) => item?.approver?.displayName || `User ${item?.approver?.userId}`).join(', ')
          };
        });
      if (this.assessmentData.templateId) {
        const _url = this.isVendorContext ? CREATE_VENDOR_TEMPLATE : CREATE_TEMPLATE;
        this.templateDetails = await this.assessmentApiHelperService.getTemplateDetails(this.assessmentData.templateId, null, _url)
      }
      if (this.templateDetails?.sections) {
        this.assessments = this.templateDetails?.sections || [];
      }
      if (this.taskListComponent) {
        this.taskListComponent.sections = this.assessments;
      }
      this.link = this.assessmentData?.assessmentLink ?? '';
      this.navigateToTab()
      await this.updateCurrentRequestIndex();
    }
  }

  getTemplateName(): string {
    return this.templateDetails?.template?.name || '';
  }

  getTemplateType(): string {
    return this.templateDetails?.template?.assessmentType?.name || '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB');
  }

  onCopy() {
    navigator.clipboard.writeText(this.link).then(() => {
      this.snackbarService.openSnack("Link copied");
    }).catch(err => {
      console.error('Link copy failed:', err);
    });
  }

  async onAcceptResponse(question: any) {
    question.isAcceptResponseLoading = true;

    try {
      const res = await this.assessmentApiHelperService.acceptResponse(question.id);
      if (res.success) {
        question.isAcceptResponseLoading = false;
        question.status = res.data.question.status;
      }
    } catch (e) {
      question.isAcceptResponseLoading = false;
      console.error('Error', e);
      throw e;
    }
  }

  async onRejectJustification(question: any) {
    question.showComment = true;
  }

  async doneReject(question: any) {
    if (!question.rejectedReason) {
      this.snackbarService.openSnack("Comment is required");
      return;
    }

    question.isRequestJustificationLoading = true;

    try {
      const res = await this.assessmentApiHelperService.requestJustification(question.id, question.rejectedReason);
      if (res.success) {
        question.isRequestJustificationLoading = false;
        question.status = res.data.question.status;
        question.showComment = false;
        Object.assign(question, res.data.question);
      }
    } catch (e) {
      question.isRequestJustificationLoading = false;
      console.error('Error:', e);
      throw e;
    }
  }

  cancelReject(question: any) {
    question.rejectedReason = '';
    question.showComment = false;
  }

  closeDrawer() {
    this.rightDrawer.close();
  }

  onRiskBasisNavigate(target: { sectionId: number; questionId: number }): void {
    this.qrFocusTarget = {
      sectionId: target.sectionId,
      questionId: target.questionId,
      messageId: 0,
      parentId: 0,
      conversationPage: 0,
      childCount: 0
    };
    const idx = this.tabHeaderDetails.findIndex(
      tab => tab.key === AssessmentDetailsKey.QUESTION_AND_RESPONSE
    );
    if (idx !== -1) this.selectedTabIndex = idx;
  }

  onNavigateToAssessment(event: { assessmentId: number }) {
    const idx = this.tabHeaderDetails.findIndex(
      tab => tab.key === AssessmentDetailsKey.DETAILS
    );
    if (idx !== -1) this.selectedTabIndex = idx;
  }

  openRiskDrawer(): void {
    this.riskDrawerService.open({
      assessmentId: this.assessmentId,
      sections: this.assessments,
      editData: null,
      isEditMode: false,
      riskMatrix: this.assessmentData?.riskMatrix,
      hideQuestionFields: true,
    });
  }

  openEditRiskDrawer(risk: any, source?: string): void {
    this.riskDrawerService.open({
      assessmentId: this.assessmentId,
      questionId: risk.questionId,
      sections: this.assessments,
      editData: risk,
      isEditMode: true,
      riskMatrix: this.assessmentData?.riskMatrix,
      source,
    });
  }

  closeRiskDrawer(): void {
    this.riskDrawerService.close();
  }

  onRiskSaved(): void {
    this.riskDrawerService.notifySaved();
    this.assessmentRiskDrawer.close();
  }

  closeRiskViewDrawer(): void {
    this.assessmentRiskViewDrawer.close();
  }

  onRiskViewEdit(riskData: any): void {
    this._riskViewPayloadBeforeEdit = this.riskViewPayload;
    this.assessmentRiskViewDrawer.closedStart.pipe(take(1)).subscribe(() => {
      setTimeout(() => this.openEditRiskDrawer(riskData, 'RISK_VIEW_EDIT'), 420);
    });
    this.assessmentRiskViewDrawer.close();
  }

  onRiskViewDelete(riskData: any): void {
    this.assessmentRiskViewDrawer.close();
    this.riskViewDrawerService.triggerDelete(riskData);
  }

  onRiskViewRefresh(): void {
    this.riskViewDrawerService.notifyTaskSaved();
  }

  onRiskViewCreateTask(riskData: any): void {
    this.riskViewDrawerService.triggerCreateTask({
      riskData,
      assessmentId: this.riskViewPayload?.assessmentId ?? 0,
      sections: this.riskViewPayload?.sections ?? [],
      risks: [riskData],
      source: 'RISK_VIEW_DRAWER',
    });
  }

  closeCreateTaskDrawer(): void {
    this.assessmentCreateTaskDrawer?.close();
    this.createTaskRiskData = null;
  }

  onCreateTaskSaved(event: any): void {
    const source = this.createTaskRiskData?.source;
    const taskId = this.createTaskRiskData?.taskData?.taskId;
    const assessmentId = this.createTaskRiskData?.assessmentId;

    if (source === 'ASSESSMENT_TASK_EDIT' && taskId && this.createTaskRiskData?.reopenDetailOnSave) {
      this.assessmentCreateTaskDrawer.closedStart.pipe(take(1)).subscribe(() => {
        setTimeout(() => this.riskViewDrawerService.triggerReopenTaskDetail({ taskId, assessmentId }), 420);
      });
    } else if (source === 'RISK_VIEW_DRAWER') {
      const payload = this._riskViewPayloadBeforeTaskCreate;
      this._riskViewPayloadBeforeTaskCreate = null;
      if (payload) {
        this.assessmentCreateTaskDrawer.closedStart.pipe(take(1)).subscribe(() => {
          setTimeout(() => this.riskViewDrawerService.open(payload), 420);
        });
      }
    }

    this.assessmentCreateTaskDrawer?.close();
    this.createTaskRiskData = null;
    this.riskViewDrawerService.notifyTaskSaved();
  }

  openDrawers(event?: { mode: 'ADD' | 'VIEW', data?: any }) {
    this.drawerType = 'risk';
    this.drawerMode = {
      mode: event?.mode || 'ADD',
      data: event?.data || null
    };
    this.selectedRisk = event?.data || null;
    this.rightDrawer.open();
  }

  handleOpenDrawer(data: any) {
    this.drawerMode = data;
    setTimeout(() => {
      this.rightDrawer.open();
    }, 0);
  }

  onRaiseRisk(question: any) {
    const section = this.assessments.find(sec =>
      sec.questions.some((q: { id: any; }) => q.id === question.id)
    );
    const sectionName = section ? section.sectionName : '';
    const dialogRef = this.dialog.open(RiskDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        questionId: question.id,
        fromAssessment: true
      }
    });
    dialogRef.componentInstance.riskForm.patchValue({
      parameterId: sectionName
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // this.snackbarService.openSnack('Risk added successfully');
      }
    });
  }

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        entityId: this.assessmentId,
        audit_log_module: AUDIT_LOG_MODULE.ASSESSMENT,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.ASSESSMENT
      }
    });
  }


  onMeasureUpdated(updatedMeasure: any) {
    if (this.riskTab && this.riskTab.expandedRisk) {
      this.riskTab.updateMeasure(updatedMeasure);
    }
  }

  getStatusConfig(status: string) {
    return this.statusConfig[status] || { label: status, color: '#FFFFFF' };
  }

  onTabChange(event: MatTabChangeEvent) {
    const index = event.index;
    const detailsTabIndex = this.tabHeaderDetails.findIndex(tab => tab.key === AssessmentDetailsKey.DETAILS);
    const qrTabIndex = this.tabHeaderDetails.findIndex(tab => tab.key === AssessmentDetailsKey.QUESTION_AND_RESPONSE);

    if (this._activeTabIndex === qrTabIndex && index !== qrTabIndex) {
      this.qrFocusTarget = null;
    }
    if (index === detailsTabIndex && this._activeTabIndex !== detailsTabIndex && !this.forceRefresh) {
      this.loadAssessmentDetails(this.assessmentId);
    }
    else if (index === 2) {
      if (this.riskListComponent) this.riskListComponent.loadData();
    }
    else if (index === 3) {
      if (this.taskListComponent) this.taskListComponent.loadData();
    }
    this._activeTabIndex = index;

    if (this.forceRefresh) {
      this.loadAssessmentDetails(this.assessmentId);
    }
  }

  startEdit(query: any) {
    query.isEdit = true;
    const res = query.responseDetails?.[query.responseDetails.length - 1];
    if (!res) return;
    switch (query.type) {
      case this.CHECK_BOX:
      case this.FILE_UPLOAD:
        try {
          const parsed = typeof res.response === 'string' ? JSON.parse(res.response) : res.response;
          res.tempResponse = Array.isArray(parsed) ? [...parsed] : [];
        } catch {
          res.tempResponse = Array.isArray(res.response) ? [...res.response] : [];
        }
        break;
      default:
        res.tempResponse = res.response;
        break;
    }
  }

  closeEdit(query: any) {
    const res = query.responseDetails?.[query.responseDetails.length - 1];
    if (!res) return;
    switch (query.type) {
      case this.CHECK_BOX:
      case this.FILE_UPLOAD:
        try {
          res.tempResponse = Array.isArray(res.response) ? [...res.response] : JSON.parse(res.response || '[]');
        } catch {
          res.tempResponse = [];
        }
        break;
      default:
        res.tempResponse = res.response;
        break;
    }
    query.isEdit = false;
  }

  get isApprover(): boolean {
    return this.assessmentData?.approver ?? false;
  }

  get isRespondent(): boolean {
    return this.assessmentData?.isRespondent ?? false;
  }

  get isApprovalRequested(): boolean {
    return this.assessmentData?.approvalRequested ?? false
  }

  get hasApprover(): boolean {
    return !!this.assessmentData?.approverDetails?.length;
  }

  get needsAction() {
    return this.assessmentData?.needsAction?.actionType?.length ? true : false
  }

  get actionToolTipMessage() {
    return `Action needed!`
  }

  navigateToTab() {
    const routeBack = this.assessmentService.routeBack   //restore the tab status after navigate back from task detail page
    if (routeBack) {
      this.setActiveTab(routeBack)
      this.assessmentService.deleteRouteBack();
      return
    }

    if (this.pendingSection === AssessmentDetailsKey.TASKS || this.pendingTaskId) {
      this.goToTasksTab();
      return;
    }

    setTimeout(() => {
      if (this.needsAction) {
        if (this.assessmentData?.needsAction?.actionType.includes(TAB_HEADER_DETAILS[2].key)) {
          this.selectedTabIndex = 2
        }
      }
    }, 200);

    if (this.pendingSection === AssessmentDetailsKey.QUESTION_AND_RESPONSE) {
      setTimeout(() => {
        if (this.pendingQrSectionId && this.pendingQrQuestionId) {
          this.qrFocusTarget = {
            sectionId: this.pendingQrSectionId!,
            questionId: this.pendingQrQuestionId!,
            messageId: 0,
            parentId: 0,
            conversationPage: 0,
            childCount: 0
          };
        }
        const idx = this.tabHeaderDetails.findIndex(tab => tab.key === AssessmentDetailsKey.QUESTION_AND_RESPONSE);

        if (idx !== -1) this.selectedTabIndex = idx;
        this.pendingQrSectionId = null;
        this.pendingQrQuestionId = null;
        this.pendingSection = null;
      }, 300);
    }
  }

  setSelectedTab(event: any) {
    this.setActiveTab(event.key)
  }

  setActiveTab(key: string) {
    setTimeout(() => {
      if (TAB_HEADER_DETAILS[3].key == key) {
        this.selectedTabIndex = 3
      }
    }, 200);
  }

  onAssessemntLinkClick() {
    if (this.assessmentData?.uuid) {
      this.assessmentService.navigateToQuestionnare(this.assessmentData?.uuid)
    }
  }

  get selfRespondent() {
    return this.assessmentData?.selfRespondent ?? false
  }

  openCreateTaskForQuestion(question: any): void {
    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        requestRid: this.assessmentId,
        task: null,
        parentTask: null,
        dialogTitle: 'Create Task for Question',
        dialogType: RequestDialogTypes.TASK_MANAGEMENT_TASK,
        componentStage: 'QUESTION',
        requestService: null,
        dsrRequestDetails: null,
        documentsList: [],
        assessmentId: this.assessmentId,
        isQuestionTask: true,
        questionData: {
          id: question.id,
          text: question.text,
          response: this.getQuestionResponse(question)
        }
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.taskCreated) {
        this.setSelectedTab({ key: TAB_HEADER_DETAILS[3].key });
        this.snackbarService.openSnack('Task created successfully');
      }
    });
  }

  private getQuestionResponse(question: any): string {
    if (!question.responseDetails || question.responseDetails.length === 0) {
      return 'No response available';
    }

    const latestResponse = question.responseDetails[question.responseDetails.length - 1];

    if (!latestResponse.response) {
      return 'No response available';
    }

    try {
      if (typeof latestResponse.response === 'string') {
        const parsed = JSON.parse(latestResponse.response);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
        return parsed.toString();
      } else if (Array.isArray(latestResponse.response)) {
        return latestResponse.response.join(', ');
      }
      return latestResponse.response.toString();
    } catch {
      return latestResponse.response.toString();
    }
  }

  async updateCurrentRequestIndex() {
    let assessmentList = this.assessmentService.getAssessmentRid();
    let nodeIndex = assessmentList.findIndex(
      (item: any) => item.requestRid === this.assessmentId
    );
    if (nodeIndex > -1) {
      this.currentAssessmentDetails.index = nodeIndex;
      await this.loadPrevAssessmentList();
      await this.loadNextAssessmentList();
    }
  }

  async loadPrevAssessmentList() {
    const tempRequestList = this.assessmentService.getAssessmentRid();

    if (this.currentAssessmentDetails.index == 0) {
      let pageData = this.assessmentService.getNextRequestPageNo(true);
      if (pageData?.exceeded) {
        this.assessmentService.removePrevAssessmentRid();
        return;
      }

      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.assessmentService.setPrevRequestPage(pageData.pageNo);
      const list = await this.assessmentService.getAssessmentList(newPageNo);
      if (list?.length) {
        this.assessmentService.setPrevRequestShifted('true');
        this.assessmentService.setPrevRequestRid(list);
        return;
      }
    }

    this.assessmentService.setPrevRequestRid(tempRequestList);
    this.assessmentService.setPrevRequestShifted('false');
  }

  async loadNextAssessmentList() {
    const tempRequestList = this.assessmentService.getAssessmentRid();

    const currentSize = this.assessmentService.getAssessmentRid()?.length ?? 0;
    if (currentSize - this.currentAssessmentDetails.index == 1) {
      const pageData = this.assessmentService.getNextRequestPageNo();
      if (pageData?.exceeded) {
        this.assessmentService.removeNextRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.assessmentService.setNextRequestPage(newPageNo);
      const list = await this.assessmentService.getAssessmentList(newPageNo);
      if (list?.length) {
        this.assessmentService.setNextRequestShifted('true');
        this.assessmentService.setNextRequestRid(list);
        return;
      }
    }

    this.assessmentService.setNextRequestRid(tempRequestList);
    this.assessmentService.setNextRequestShifted('false');
  }

  async goToPrevRequest() {
    this.currentAssessmentDetails.index--;
    this.navigationDirection = 'prev';

    if (this.assessmentService.getPrevAssessmentShifted()) {
      const tempAssessmentList = this.assessmentService.getPrevAssessmentRid();
      this.assessmentService.setAssessmentRid(tempAssessmentList);
      const currentRequestSize = this.assessmentService.getAssessmentRid()?.length ?? 0;
      this.currentAssessmentDetails.index = currentRequestSize - 1;
      this.assessmentService.setPrevRequestShifted('false');
      this.assessmentService.setPrevRequestPage(0, true);
    }
    const currentRequest = this.assessmentService.getNextOrPrevRequestRid(this.currentAssessmentDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.requestRid);
    }
  }

  async goToNextRequest() {
    this.currentAssessmentDetails.index++;
    this.navigationDirection = 'next';

    if (this.assessmentService.getNextRequestShifted()) {
      const tempNextRequestList = this.assessmentService.getNextRequestRid();
      this.assessmentService.setAssessmentRequestRid(tempNextRequestList);
      this.currentAssessmentDetails.index = 0;
      this.assessmentService.setNextRequestShifted('false');
      this.assessmentService.setNextRequestPage(0, true);
    }
    const currentRequest = this.assessmentService.getNextOrPrevRequestRid(this.currentAssessmentDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.requestRid);
    }
  }

  openNextRequest(assessmentRid: number) {
    this.router.navigate([`${this.currentPath}/${assessmentRid}`])
  }

  get disablePrevBtn() {
    return this.assessmentService.getPrevAssessmentRid()?.length === 0 || this.isLoading;
  }

  get disableNextBtn() {
    return this.assessmentService.getNextRequestRid()?.length === 0 || this.isLoading;
  }

  dowload() {
    throw new Error('Method not implemented.');
  }
  openEditStatus() {
    const dialogRef = this.dialog.open(StatusUpdateDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'assessment',
        assessmentId: this.assessmentId,
        currentStatus: this.element?.status
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.externalRespondentLoaded = false;
        this.loadAssessmentDetails(this.assessmentId);
      }
    });
  }

  openTriggerDrawer() {
    this.drawerType = 'trigger';

    this.drawerMode = {
      mode: 'VIEW',
      data: {
        triggers: this.assessmentData?.triggerMappings || [],
        triggerReason: this.assessmentData?.triggerReason || ''
      }
    };

    this.rightDrawer.open();
  }

  goToTasksTab(): void {
    const taskTabIndex = this.tabHeaderDetails.findIndex(
      tab => tab.key === AssessmentDetailsKey.TASKS
    );

    if (taskTabIndex !== -1) {
      this.selectedTabIndex = taskTabIndex;
    }
  }

  goToRiskTab() {
    const taskTabIndex = this.tabHeaderDetails.findIndex(
      tab => tab.key === AssessmentDetailsKey.RISK_AND_MEASURES
    );

    if (taskTabIndex !== -1) {
      this.selectedTabIndex = taskTabIndex;
    }
  }

  goToDetailsTab() {
    this.previousTabIndex = this.selectedTabIndex;

    const detailsIndex = this.tabHeaderDetails.findIndex(
      tab => tab.key === AssessmentDetailsKey.DETAILS
    );

    if (detailsIndex !== -1) {
      this.selectedTabIndex = detailsIndex;
      this.showBackButton = true;
    }
  }

  setTabHeaders() {
    if (this.isRespondent && !this.isAuthor) {
      return
    }
    if (this.isApprover && !this.isAuthor) {
      this.tabHeaderDetails = [...TAB_HEADER_DETAILS, ...APPROVAL_TAB_HEADER_DETAILS];
      return
    }
    this.tabHeaderDetails = [...TAB_HEADER_DETAILS, ...APPROVAL_TAB_HEADER_DETAILS, ...OTHER_TAB_HEADER_DETAILS]
  }

  onNavigateToMessage(target: DiscussionLogNavigationTarget): void {
    this.qrFocusTarget = { ...target };
    const qrTabIndex = this.tabHeaderDetails.findIndex(
      tab => tab.key === AssessmentDetailsKey.QUESTION_AND_RESPONSE
    );
    if (qrTabIndex !== -1) {
      this.selectedTabIndex = qrTabIndex;
    }
  }


  onNavigateToTask(event: { taskId: number; messageId: number }): void {
    this.pendingTaskId = event.taskId;
    this.pendingMessageId = event.messageId;

    if (this.assessmentRiskViewDrawer?.opened) {
      this.assessmentRiskViewDrawer.closedStart.pipe(take(1)).subscribe(() => {
        setTimeout(() => {
          this.goToTasksTab();
        }, 1000);
      });
      this.assessmentRiskViewDrawer.close();
    } else {
      this.goToTasksTab();
    }

    setTimeout(() => {
      this.pendingTaskId = null;
      this.pendingMessageId = null;
    }, 3000);
  }

  get templateId() {
    return this.assessmentData?.templateId ?? 0
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

  get assessmentStatus() {
    return this.assessmentData?.state ?? ''
  }

  setQuestionAndResponseTabDetails() {
    if (this.isAuthor && this.isRespondent) {
      this.userCanDoSubmitAssessment = (this.assessmentService.assessmentIsOpen(this.assessmentStatus) || this.assessmentService.assessmentIsInProgress(this.assessmentStatus)) ? true : false;
      if (this.assessmentData) {
        this.assessmentData.selfRespondent = true
      }
      return
    }
    this.userCanDoSubmitAssessment = this.isRespondent ? true : false;
  }

  onPostExternalLink(event: any) {
    this.externalRespondentLoaded = event?.loaded;
  }

  private handleSseEvent(event: any): void {
    try {
      if (event.data === 'Connected!') {
        return;
      }
      const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      const messageType = eventData?.messageType;
      const entityId = eventData?.entityId;
      if (messageType == NOTIFICATION_MESSAGE_TYPE.RESPONDENT_AS_AUTHOR_SUBMITTED && entityId == this.assessmentId) {
        this.forceRefresh = true;
        this.userCanDoSubmitAssessment = false;
      }
    }
    catch (error) {
      console.error('Error handling SSE event:', error, event);
    }
  }
}
