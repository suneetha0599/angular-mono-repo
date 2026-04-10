import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from "@angular/material/menu";
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { AssessmentData, TemplateDetail } from '@admin-page/assessments/assessments/assignment-model';
import { SecurityControlService } from '@admin-core/services/security-control/security-control.service';
import { RiskMitigationDrawerComponent } from '../../../risk-mitigation-drawer/risk-mitigation-drawer.component';
import { displayStatusText, statusColors, statusTextColors } from '@admin-page/request-management/request-utils';
import { ImpactLevel, LikelihoodLevel, RiskData } from '../models/risk-summary-model';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CREATE_TEMPLATE } from '@admin-core/constants/api-constants';
interface TabHeader {
  name: string;
}
@Component({
  selector: 'app-approve-mitigation',
  imports: [CommonModule, MatInputModule, MatCardModule, MatTabsModule, MatIconModule, LoadingButtonComponent, EllipsisTooltipDirective, MatTooltipModule,
    MatTableModule, MatDrawer, MatDrawerContainer, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatCheckboxModule, MatMenuModule, RiskMitigationDrawerComponent],
  templateUrl: './approve-mitigation.component.html',
  styleUrl: './approve-mitigation.component.scss'
})
export class ApproveMitigationComponent {
  selectedTabIndex: number = 0;
  isLoading: boolean = false;
  isDrawerOpen = false;
  drawerOpen = false;
  mitigationForm: FormGroup;
  hasMitigation: boolean = false
  currentPath = ''
  submitted = false
  assessmentData: AssessmentData | null = null;
  element: any;
  assessments: any[] = [];
  securityControlList: any[] = [];
  submitLoading = false
  securityControlForm!: FormGroup;
  drawerMode: { mode: 'ADD' | 'VIEW' | 'EDIT', data?: any } = { mode: 'ADD' };
  @ViewChild('rightDrawer') rightDrawer!: MatDrawer;
  private securityControlService = inject(SecurityControlService);
  displayedColumns: string[] = ['riskId', 'description', 'riskLevel', 'mitigationId', 'standard', 'residualRisk', 'mitigationDesc', 'status', 'action'];
  riskList = [];
  assessmentId!: number;
  templateDetails: TemplateDetail | any


  @Output() openDrawer = new EventEmitter<any>();
  riskId = 0
  selection = new SelectionModel<any>(true, []);
  link = '';

  private route = inject(ActivatedRoute);
  private apiHelperService = inject(ApiHelperService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService)
  private snackbarService = inject(SnackbarService);
  private assessmentService = inject(AssessmentService);

  constructor(private fb: FormBuilder, private router: Router) {
    this.mitigationForm = this.fb.group({
      standard: [''],
      controlCategory: [''],
      controlDescription: [''],
      mitigationMeasures: ['']
    });
  }

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      this.assessmentId = +params['id'];
      if (this.assessmentId) {
        await this.loadAssessmentDetails(this.assessmentId);
        await this.loadAssessmentMeasureDetails(this.assessmentId);
      } else {
        this.snackbarService.openSnack('Assessment ID not found in URL');
      }
    });
    this.getSecurityControlList();
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
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

  async loadAssessmentMeasureDetails(assessmentId: number) {
    this.isLoading = true;
    try {
      const res = await this.assessmentApiHelperService.getAssessmentMeasureDetail(assessmentId);
      const riskMeasures = res?.riskMeasuresDetail || [];
      this.riskList = riskMeasures.map((item: any) => ({
        riskId: item.riskId,
        description: item.riskDescription,
        mitigationId: item.measure?.id || '',
        standard: item.measure?.standard || '',
        residualRisk: item.measure?.residualRisk || '',
        riskLevel: RiskData.calculateRiskLevel(
          this.mapLikelihood(item.likelihood),
          this.mapImpact(item.impact)
        ) || '',
        mitigationDesc: item.measure?.measureDescription || '',
        measure: item.measure,
        status: item.measure?.status || '',
        risk: {
          id: item.riskId, description: item.riskDescription, parameterName: item.parameterName, riskLevel: RiskData.calculateRiskLevel(
            this.mapLikelihood(item.likelihood),
            this.mapImpact(item.impact)
          )
        }
      }));
    } catch (error) {
      console.error('Error fetching assessment measures:', error);
      this.snackbarService.openSnack('Failed to load risk measures');
    } finally {
      this.isLoading = false;
    }
  }


  async loadAssessmentDetails(assessmentId: number) {
    this.isLoading = true;
    try {
      this.assessmentData = await this.assessmentApiHelperService.getAssessmentDetail(assessmentId);

      if (this.assessmentData) {
        const { _assessmentData, _assessmentDetail } = await this.assessmentService.prepareAssessmentDetail(this.assessmentData);
        this.assessmentData = { ..._assessmentData };
        this.element = { ..._assessmentDetail };
        const _url = CREATE_TEMPLATE;
        this.templateDetails = await this.assessmentApiHelperService.getTemplateDetails(this.assessmentData.templateId, null, _url)
        if (this.templateDetails?.sections) {
          this.assessments = this.templateDetails?.sections || [];
        }
        this.link = this.assessmentData.assessmentLink ?? '';
      } else {
        // this.snackbarService.openSnack('Failed to load assessment details');
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    } finally {
      this.isLoading = false;
    }
  }

  closeDrawer() {
    this.rightDrawer.close();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.riskList.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.riskList.forEach(row => this.selection.select(row));
  }

  onViewDetails() {
    const assessmentId = this.assessmentData?.id;
    this.router.navigate(
      [`/user/assessments/assessment/details/${assessmentId}`],
      { queryParams: { viewDetails: true } }
    );
  }



  openDrawers(data: { risk: any; measure?: any; mode: 'ADD' | 'EDIT' | 'VIEW' }) {
    this.drawerMode = {
      mode: data.mode,
      data: {
        risk: data.risk,
        measure: data.measure
      }
    };
    this.rightDrawer.open();
  }

  editMeasure(risk: any, measure: any) {
    this.openDrawers({
      risk: { ...risk },
      measure: { ...measure },
      mode: 'EDIT'
    });
  }


  async onApproveMeasure(operation: 'APPROVED' | 'REJECTED', risk: any, measure: any) {
    const riskId = risk?.id;
    const measureId = measure?.id;

    if (!riskId || !measureId) {
      console.error('Missing riskId or measureId');
      return;
    }

    await this.apiHelperService.approveMeasure(operation, null, riskId, measureId);
    this.loadAssessmentMeasureDetails(this.assessmentId)
  }

  get isApprovalRequested(): boolean {
    return this.assessmentData?.approvalRequested ?? false
  }

  onFinalSubmit() {
    this.submitLoading = true
    this.apiHelperService.approverFinalSubmit(null, this.assessmentId)
      .then((res) => {
        this.submitLoading = false
        this.submitted = true;
      })
      .catch((err) => {
        this.submitLoading = false
        console.error('Error sending for approval:', err);
      });
  }

  getStatusColors(status: string): string {
    return statusColors(status)
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status)
  }

  getStatusText(status: string): string {
    return displayStatusText(status)
  }


  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private mapLikelihood(likelihood: string): LikelihoodLevel {
    switch (likelihood.toUpperCase()) {
      case 'REMOTE':
        return LikelihoodLevel.REMOTE;
      case 'POSSIBLE':
        return LikelihoodLevel.POSSIBLE;
      case 'PROBABLE':
        return LikelihoodLevel.PROBABLE;
      default:
        return LikelihoodLevel.POSSIBLE;
    }
  }

  private mapImpact(impact: string): ImpactLevel {
    switch (impact.toUpperCase()) {
      case 'MINIMUM':
        return ImpactLevel.MINIMUM;
      case 'SIGNIFICANT':
        return ImpactLevel.SIGNIFICANT;
      case 'SEVERE':
        return ImpactLevel.SEVERE;
      default:
        return ImpactLevel.SIGNIFICANT;
    }
  }
}