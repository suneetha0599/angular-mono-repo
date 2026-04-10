import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AssessmentData } from '../../assignment-model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { TriggerDetailDrawerComponent } from "../trigger-detail-drawer/trigger-detail-drawer.component";
import { AssessemntSource } from '../../constants';
import { Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { TEMPLATE_MODE } from '@admin-page/assessments/templates/constants';
import { AuthService } from '@admin-core/services/auth.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { EchartsComponent } from '@admin-page/dashboard/echarts/echarts.component';
import { SafeHtmlPipe } from '@valura-lib/components/safe-html.pipe';

@Component({
  selector: 'app-assessment-details',
  imports: [EllipsisTooltipDirective, MatIconModule, EchartsComponent, MatTooltipModule, CommonModule,
    FormsModule, MatTableModule, MatSidenavModule, SafeHtmlPipe],
  templateUrl: './assessment-details.component.html',
  styleUrl: './assessment-details.component.scss'
})
export class AssessmentDetailsComponent {

  @Input() assessmentData: AssessmentData | null = null;
  @Input() element: any;
  @Input() respondentDataSource!: MatTableDataSource<any>;
  @Input() approverDataSource!: MatTableDataSource<any>;
  @Input() assessmentId!: number;
  @Input() approver: boolean = false;
  @Input() assessmentSource: string = AssessemntSource.GENERAL

  @Output() openDrawer = new EventEmitter<void>();
  @Output() openStatus = new EventEmitter<void>();
  @Output() goToTasksTab = new EventEmitter<void>();
  @Output() goToRiskTab = new EventEmitter<void>();
  @Output() onAssessemntLinkClick = new EventEmitter<any>();

  riskChartData: { value: number; name: string }[] = [];
  taskProgressData: { value: number; name: string }[] = [];
  questionData: { value: number; name: string }[] = [];
  totalRiskCount = 0;
  currentPath: string = '';
  displayedHeaders = ['name', 'userType'];
  approverDisplayedHeaders = ['level', 'totalApprovers', 'name'];

  questionColors = ['#F3F4F6', '#1C2B70'];
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
  taskColors = ['#F3F4F6', '#D7F049'];

  private authService = inject(AuthService);

  // getDaysCompleted(createdOn: string): number {
  //   if (!createdOn) return 0;
  //   const parts = createdOn.split('.');
  //   const createdDate = new Date(
  //     Number(parts[2]),
  //     Number(parts[1]) - 1,
  //     Number(parts[0])
  //   );

  //   const today = new Date();
  //   createdDate.setHours(0, 0, 0, 0);
  //   today.setHours(0, 0, 0, 0)
  //   const diffTime = today.getTime() - createdDate.getTime();
  //   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  //   return diffDays >= 0 ? diffDays : 0
  // }

  constructor(
    private dialog: MatDialog, private router: Router,
    private snackbarService: SnackbarService,) { }

  ngOnInit() {
    this.onInitPage();
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessmentData'] && this.assessmentData) {
      const risk = this.assessmentData.riskSummary;

      this.riskChartData = [
        { value: risk?.highRiskCount ?? 0, name: 'High' },
        { value: risk?.mediumRiskCount ?? 0, name: 'Medium' },
        { value: risk?.lowRiskCount ?? 0, name: 'Low' }
      ];
      this.totalRiskCount = (risk?.highRiskCount ?? 0) + (risk?.mediumRiskCount ?? 0) + (risk?.lowRiskCount ?? 0);
      const taskSummary = this.assessmentData.assessmentTaskSummary;
      const questionSummary = this.assessmentData.assessmentQuestionSummary;

      this.taskProgressData = [
        { value: taskSummary?.PENDING ?? 0, name: 'Pending' },
        { value: taskSummary?.COMPLETED ?? 0, name: 'Completed' },
      ]

      const totalTasks =
        (taskSummary?.COMPLETED ?? 0) + (taskSummary?.PENDING ?? 0);

      this.questionData = [
        { value: questionSummary?.PENDING ?? 0, name: 'Pending' },
        { value: questionSummary?.ANSWERED ?? 0, name: 'Answered' },
      ];
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';

    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${dd}.${mm}.${yyyy}`;
  }

  formatDateforCreatedOn(dateStr: string): string {
    if (!dateStr) return '';

    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB');
  }
  openEditStatus() {
    this.openStatus.emit();
  }

  onCopy() {
    navigator.clipboard.writeText(this.assessmentData?.uuid ?? '').then(() => {
      this.snackbarService.openSnack("Link copied");
    }).catch(err => {
      console.error('Link copy failed:', err);
    });
  }

  onClickRegulation() {
    this.openDrawer.emit();
  }

  viewTask() {
    this.goToTasksTab.emit();
  }

  viewRisks() {
    this.goToRiskTab.emit()
  }


  formatUserType(value: string | null | undefined): string {
    if (!value) return '';

    return value
      .replace(/_?USER$/i, '')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  getApproversName(names: any) {
    const res = names.split(',').map((s: any) => s).filter((s: string) => s.trim())
    const count = res.length - 1
    if (res.length <= 1) {
      return res
    }
    return `${res[0]} + ${count}`
  }

  getFirstApproverName(names: any): string {
    if (!names) return '';
    const res = names.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    return res[0] || '';
  }

  getApproversCount(names: any): number {
    if (!names) return 0;
    const res = names.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    return res.length > 1 ? res.length - 1 : 0;
  }

  getApproversTooltip(names: any): string {
    if (!names) return '';
    const res = names.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    return res.length > 1 ? res.join(', ') : '';
  }

  get assessmentAge() {
    return this.assessmentData?.assessmentAge && this.assessmentData?.assessmentAge > 1 ? `${this.assessmentData.assessmentAge} days` : `${this.assessmentData?.assessmentAge ?? 0} day`
  }

  onClickAssessmentLink() {
    if (this.selfRespondent) {
      this.onAssessemntLinkClick.emit();
    }
  }

  get isAuthor() {
    return this.assessmentData?.isAuthor
  }

  get selfRespondent() {
    return this.assessmentData?.selfRespondent
  }

  get isVendorContext() {
    return this.assessmentSource == AssessemntSource.VENDOR
  }

  navigateTotemplateDetail() {
    if (this.isInternalOrExternalUser) return;
    const templateId = this.assessmentData?.templateId;
    if (!templateId) {
      return
    }
    const routeSource = "assessemnt";
    const queryParams = { templateId: templateId, mode: TEMPLATE_MODE.VIEW };
    const templateBasePath = this.currentPath.split(`/${routeConstants.ASSESSMENT}/`)[0];
    this.router.navigate([`${templateBasePath}/${routeConstants.TEMPLATES}/${routeConstants.TEMPLATE_DETAILS}`],
      {
        queryParams: queryParams,
        state: {
          routeSource: routeSource,
        }
      });
  }

  get isInternalOrExternalUser(): boolean {
    return !!(this.authService.isExternalUser || this.authService.isInternalUser)
  }
}
