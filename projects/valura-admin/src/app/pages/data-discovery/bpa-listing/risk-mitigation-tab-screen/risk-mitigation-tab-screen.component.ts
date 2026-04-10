import { Component, EventEmitter, inject, Input, Output, SimpleChanges, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FIRST_PAGE, HEADER_ACTION, HEADER_STATUS, HEADER_VENDOR_STATUS, RISK, RISK_LISTING_HEADER, RISK_OPTIONS } from '../constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { ImpactLevel, LikelihoodLevel, RiskData } from '../create-bpa/risk-summary-screen/models/risk-summary-model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatMenuModule } from "@angular/material/menu";
import { displayStatusText } from '../bpa-utils';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RiskMitigationDrawerComponent } from '../risk-mitigation-drawer/risk-mitigation-drawer.component';
import { MatDialog } from '@angular/material/dialog';
import { AddCategoryDialogComponent } from '../../data-discovery-dialog/add-category-dialog/add-category-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateTaskDialogComponent } from '../../../../pages/request-management/request-management-dialog/create-task-dialog/create-task-dialog.component';
import { RequestDialogTypes } from '../../../../pages/request-management/constant';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as AssessmentApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { TAB_HEADER_DETAILS } from '@admin-page/assessments/assessments/constants';
import { statusColors, statusTextColors } from '@admin-page/request-management/request-utils';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { RiskDialogComponent } from '../create-bpa/risk-summary-screen/risk-dialog/risk-dialog.component';

@Component({
  selector: 'app-risk-mitigation-tab-screen',
  imports: [CommonModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatProgressSpinnerModule, LoadingButtonComponent,
    MatTableModule, MatFormFieldModule, MatCardModule, ReactiveFormsModule, FormsModule, MatInputModule, MatMenuModule, MatOptionModule, MatSelectModule],
  templateUrl: './risk-mitigation-tab-screen.component.html',
  styleUrl: './risk-mitigation-tab-screen.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class RiskMitigationTabScreenComponent implements OnInit {

  @Input() isApproved: boolean = false;
  @Input() approverExist: boolean = false;
  @Input() assessmentId!: number;
  @Input() isApprovalRequest: boolean = false;
  @Input() isAssessment = false;
  @Output() openDrawer = new EventEmitter<any>();
  @Output() setSelectedTab = new EventEmitter<any>();

  currentPath!: string;
  isLoading!: boolean;
  isSendForApprovalLoading = false;
  submitLoading = false;
  displayedColumns: string[] = ['riskId', 'parameter', 'description', 'CategoryType', 'riskLevel', 'hasMitigation', 'mitigation', 'approved'];

  approveSent = false
  dataSource = new MatTableDataSource<any>();
  tableHeaders: any = [];
  displayedHeaders = [];
  pageSize: any;
  riskList: RISK[] = [];
  pageNo: number = FIRST_PAGE;
  totalItems: number = 0;
  paginator: any;

  submitted = false

  HEADER_EXPAND = 'expand';
  RISK_LISTING_HEADER = RISK_LISTING_HEADER
  HEADER_ACTION = HEADER_ACTION
  HEADER_STATUS = HEADER_STATUS

  HEADER_VENDOR_STATUS = HEADER_VENDOR_STATUS
  private apiHelperService = inject(ApiHelperService);
  private assessmentApiHelperService = inject(AssessmentApiHelperService);
  private route = inject(ActivatedRoute);
  viewMode!: string;
  riskId: any;
  riskLevel: any;
  risks!: any;
  RISK_OPTIONS = RISK_OPTIONS
  editingRowId: number | null = null;
  editedCategoryType: string | null = null;

  private dialogRef!: MatDialogRef<CreateTaskDialogComponent>;
  private snackbarService = inject(SnackbarService);
  measures: any[] = [];
  selectedMeasureId: number | null = null;

  constructor(private router: Router, private dialog: MatDialog) { }
  private initialized = false;

  ngOnInit(): void {
    this.onInitPage();
    this.setTableInfo();
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    if (changes['isApproved']?.currentValue !== changes['isApproved']?.previousValue) {
      this.setTableInfo();
    } else if (changes['assessmentId']?.currentValue &&
      changes['assessmentId']?.currentValue !== changes['assessmentId']?.previousValue) {
      this.setTableInfo();
    }
  }

  assessments: any[] = [];

  onRaiseRisk(question: any) {
    const dialogRef = this.dialog.open(RiskDialogComponent, {
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        questionId: question.id,
        fromAssessment: true,
        editData: question
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getRiskList(this.pageNo);
    });
  }

  onDelete(risk: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Risk?',
        confirmationDetail: risk.parameter ?? risk.title ?? '',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      try {
        await this.apiHelperService.deleteRisk(risk.id);
        await this.getRiskList(this.pageNo);

      } catch (error) {
        console.error('Error deleting risk:', error);
      }
    });
  }

  async setTableInfo() {
    this.dataSource = new MatTableDataSource<RISK>;
    this.tableHeaders = RISK_LISTING_HEADER;
    if (this.tableHeaders?.length) {
      this.displayedHeaders = this.tableHeaders
        .filter((c: any) => !(this.isApproved && c.key === HEADER_ACTION))
        .map((c: any) => c.columnDef);
    }
    await this.getRiskList()
  }

  async getRiskList(pageNo: number = FIRST_PAGE, filters: any = null) {
    let params: any = {
      page: pageNo,
      size: this.pageSize,
    };

    if (filters) {
      params = { ...params, ...filters };
    }

    let res;
    res = await this.apiHelperService.getRiskList(params, this.assessmentId);
    if (res) {
      this.pageNo = pageNo;
      this.riskList = (res?.risks ?? []).map((risk: any) => ({
        ...risk,
        riskLevel: RiskData.calculateRiskLevel(
          this.mapLikelihood(risk.likelihood),
          this.mapImpact(risk.impact)
        )
      }));
      this.risks = res
      this.dataSource = new MatTableDataSource(this.riskList);

      if (pageNo === FIRST_PAGE) {
        this.totalItems = +(res?.totalFilteredItemsCount ?? 0)
        if (this.paginator) {
          this.paginator.firstPage();
        }
      }
    }
  }

  openCreateTaskDialogForMeasure(measure: any): void {
    console.log('Opening Create Task for Measure:', measure);

    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        requestRid: this.assessmentId,
        task: null,
        parentTask: null,
        dialogTitle: 'Create Task for Mitigation',
        dialogType: RequestDialogTypes.TASK_MANAGEMENT_TASK,
        componentStage: 'RISK_MITIGATION',
        requestService: null,
        dsrRequestDetails: null,
        documentsList: [],
        assessmentId: this.assessmentId,
        isMeasureTask: true,
        measureData: {
          id: measure?.id || 0,
          description: measure?.measureDescription || measure?.description || '',
          status: measure?.status || ''
        }
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.taskCreated) {
        this.setSelectedTab.emit({ key: TAB_HEADER_DETAILS[3].key });
      }
    });
  }

  openDrawers(data: { risk: any; measure?: any; mode: 'ADD' | 'EDIT' | 'VIEW' }) {
    this.riskId = data.risk.id;
    this.expandedRisk = data.risk;
    this.openDrawer.emit({
      mode: data.mode,
      data: {
        risk: data.risk,
        measure: data.measure
      }
    });
    this.getRiskList();
  }

  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  onApprove() {
    this.router.navigate([`${this.currentPath}/${routeConstants.MITIGATION_APPROVE}`]);
  }


  async onApproveMeasure(operation: 'APPROVED' | 'REJECTED', risk: any, measure: any) {
    const riskId = risk?.id;
    const measureId = measure?.id;

    if (!riskId || !measureId) {
      console.error('Missing riskId or measureId');
      return;
    }

    await this.apiHelperService.approveMeasure(operation, null, riskId, measureId);
    this.getRiskList()
  }

  getRiskLevel(impact: string, likelihood: string): string {
    return ''
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

  expandedElements: any[] = [];
  expandedRisk: any = null;

  isExpandedRow = (index: number, row: any) => this.isExpanded(row) && this.canExpand(row);

  viewMeasure(risk: any) {
    this.toggleRow(risk);
  }
  async toggleRow(risk: any) {
    const i = this.expandedElements.indexOf(risk);

    if (i === -1) {
      this.expandedElements.push(risk);
      if (!risk.measures) {
        try {
          const res = await this.apiHelperService.viewMeasure(risk.id);
          risk.measures = res?.measures ?? [];
        } catch (err) {
          risk.measures = [];
        }
      }
      this.dataSource.data = [...this.dataSource.data];

    } else {
      this.expandedElements.splice(i, 1);
      this.dataSource.data = [...this.dataSource.data];
    }
  }

  get displayedColumnsMeasure() {
    return ['measureDescription', 'status', 'action']

  }

  isExpanded(element: any) {
    return this.expandedElements.includes(element);
  }

  canExpand(element: any) {
    return element.measureIds?.length > 0;
  }

  editMeasure(risk: any, measure: any) {
    this.openDrawers({ risk, measure, mode: 'EDIT' });
  }

  async updateMeasure(updatedMeasure: any) {
    const risk = this.expandedRisk;
    if (!risk) return;

    try {
      const res = await this.apiHelperService.viewMeasure(risk.id);
      risk.measures = res?.measures ?? [];
      risk.measureIds = risk.measures.map((m: { id: any; }) => m.id);

      const riskIndex = this.riskList.findIndex(r => r.id === risk.id);
      if (riskIndex !== -1) {
        this.riskList[riskIndex].measures = risk.measures;
        this.riskList[riskIndex].measureIds = risk.measureIds;
      }

      this.dataSource._updateChangeSubscription();
    } catch (err) {
      console.error('Failed to fetch updated measures:', err);
    }
  }

  deleteMeasure(element: any, measure: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Measure?',
        confirmationDetail: measure.measureDescription ?? '',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      try {
        await this.apiHelperService.deleteMeasure(element.id, measure.id);
        await this.getRiskList(this.pageNo);

      } catch (error) {
        console.error('Error deleting risk:', error);
      }
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

  onSendForApproval() {
    this.isSendForApprovalLoading = true;
    this.apiHelperService.sendForApproval(null, this.assessmentId)
      .then((res) => {
        this.isSendForApprovalLoading = false
        this.approveSent = true;
      })
      .catch((err) => {
        this.isSendForApprovalLoading = false
        console.error('Error sending for approval:', err);
      });
  }

  onFinalSubmit() {
    this.submitLoading = true;
    this.apiHelperService.approverFinalSubmit(null, this.assessmentId)
      .then((res) => {
        this.submitLoading = false;
        this.submitted = true;
      })
      .catch((err) => {
        this.submitLoading = false;
        console.error('Error sending for approval:', err);
      });
  }

  isEditing(id: number): boolean {
    return this.editingRowId === id;
  }

  enableEdit(element: any) {
    this.editingRowId = element.id;
    this.editedCategoryType = element.measureType;
  }

  cancelEdit(id: number) {
    this.editingRowId = null;
    this.editedCategoryType = null;
  }

  // saveCategoryType(element: any) {
  //   const payload = { measureType: this.editedCategoryType };

  //   this.apiHelperService.updateRisk(payload, element.id)
  //     .then(() => {
  //       element.measureType = this.editedCategoryType;
  //       this.editingRowId = null;
  //       this.editedCategoryType = null;
  //     })
  //     .catch((err) => {
  //       this.editingRowId = null;
  //       this.editedCategoryType = null;
  //       console.error('Error updating category type:', err);
  //     });
  // }
  saveCategoryType(element: any) {
    const newType = this.editedCategoryType;

    if (!newType) return;
    if (newType !== 'MITIGATE') {
      const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
        ...GLOBAL_DIALOG_DEFAULTS,

        panelClass: 'dialog-wrapper',

        data: {
          type: 'reason',
        }
      });


      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.reason) {
          const payload = {
            measureType: newType,
            description: result.reason
          };

          this.apiHelperService.updateRisk(payload, element.id)
            .then(() => {
              element.measureType = newType;

            })
            .catch((err) => {
              console.error('Error updating category type:', err);

            })
            .finally(() => {
              this.editingRowId = null;
              this.editedCategoryType = null;
            });
        } else {
          this.cancelEdit(element.id);
        }
      });

    } else {
      const payload = { measureType: newType };

      this.apiHelperService.updateRisk(payload, element.id)
        .then(() => {
          element.measureType = newType;

        })
        .catch((err) => {
          console.error('Error updating category type:', err);

        })
        .finally(() => {
          this.editingRowId = null;
          this.editedCategoryType = null;
        });
    }
  }


  openDialog(data: { risk: any; measure?: any; mode: 'ADD' | 'EDIT' | 'VIEW' }) {
    const dialogRef = this.dialog.open(RiskMitigationDrawerComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        risk: data.risk,
        measure: data.measure,
        mode: data.mode,
        approver: this.isApproved
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.refreshed) {
        this.getRiskList();
      }
    });

  }


}
