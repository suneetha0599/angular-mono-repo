import { Component, signal, computed, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RiskTableComponent } from './risk-table/risk-table.component';
import { RiskTableShimmerComponent } from './risk-table/risk-table-shimmer/risk-table-shimmer.component';
import { Risk, RiskLevel, OverallRiskSummary, RiskData, ApiRisk, RiskCategory, LikelihoodLevel, ImpactLevel } from './models/risk-summary-model';
import { RiskDialogComponent } from './risk-dialog/risk-dialog.component';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { RiskMitigationTabScreenComponent } from '../../risk-mitigation-tab-screen/risk-mitigation-tab-screen.component';
import { ViewChild } from '@angular/core';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { ASSESSMENT_HEADER_BPA, FIRST_PAGE, HEADER_ACTION, HEADER_DATE, HEADER_NAME, HEADER_STATUS, HEADER_TRIGGER, PAGE_SIZE } from '../../constants';
import { Assessment } from '@admin-core/models/assessment/assessment';
import { ActivatedRoute, Router } from '@angular/router';
import { MatMenuTrigger, MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { formatStatus, statusColors, statusTextColors } from '@admin-page/request-management/request-utils';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { AssessmentsComponent } from '@admin-page/assessments/assessments/list-assessment/assessments.component';

@Component({
  selector: 'app-risk-summary-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    LoadingButtonComponent,
    RiskTableComponent,
    RiskTableShimmerComponent,
    MatTableModule,
    LoadingButtonComponent,
    MatFormFieldModule,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    RiskMitigationTabScreenComponent,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    AssessmentsComponent,
  ],
  templateUrl: './risk-summary-page.component.html',
  styleUrls: ['./risk-summary-page.component.scss']
})
export class RiskSummaryPageComponent implements OnInit {
  @Output() openDrawer = new EventEmitter<any>();
  @Output() onCreateNewAssessment = new EventEmitter<any>();


  isLoading: boolean = false;
  currentPath!: string;
  tableHeaders: any = [];
  displayedHeaders = [];
  dataSource = new MatTableDataSource<any>();
  filteredDataSource: Assessment[] = []
  assesmentList: Assessment[] = []
  pageNo: number = FIRST_PAGE
  pageSize: number = PAGE_SIZE
  totalItems: number = 0;
  requestLoading: boolean = true;
  bpaId: number = 0
  shimmerDataSource = Array(4).fill({});
  HEADER_TRIGGER = HEADER_TRIGGER
  HEADER_NAME = HEADER_NAME
  HEADER_STATUS = HEADER_STATUS
  HEADER_ACTION = HEADER_ACTION
  HEADER_DATE = HEADER_DATE
  totalAssessemntCount: number = 0;

  constructor(private router: Router, private route: ActivatedRoute) { }


  protected readonly activeTab = signal<'risk-summary' | 'assessment'>('risk-summary');
  protected readonly risks = signal<Risk[]>([]);
  protected readonly isLoadingRisks = signal<boolean>(false);
  protected selectedTabIndex = 0;
  private static risksCache: Risk[] | null = null;
  private static isLoadingCache = false;
  private static loadingPromise: Promise<void> | null = null;

  protected readonly overallRiskSummary = computed<OverallRiskSummary>(() => {
    return RiskData.generateRiskSummary(this.risks());
  });


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('statusMenuTrigger') menuTrigger!: MatMenuTrigger;

  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private assessmentService = inject(AssessmentService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const bpaRequestId = params['bpaRequestId'];
      if (bpaRequestId) {
        this.bpaId = +(bpaRequestId)
        this.setTableInfo();
      }
    });
    this.loadRisksWithCache();
  }

  async setTableInfo() {
    this.tableHeaders = ASSESSMENT_HEADER_BPA;
    this.dataSource = new MatTableDataSource<any>([]);
    // await this.getAssesmentList();
    if (this.tableHeaders?.length)
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.columnDef);
  }

  ngAfterViewInit() {
    this.setTablePaginator()
    this.dataSource.sort = this.sort;

  }

  get hasAssessments(): boolean {
    return this.dataSource?.data?.length > 0;
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

  onSortChange(event: Sort) {
    if (event.active && event.direction) {
      this.getAssesmentList(this.pageNo, null, event.active, event.direction);
    }
  }

  async getAssesmentList(
    pageNo: number = FIRST_PAGE,
    filters: any = null,
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    this.requestLoading = true;
    let params: any = {
      page: pageNo,
      size: this.pageSize,
      bpaIds: [this.bpaId]
    };

    if (filters) {
      params = { ...params, ...filters };
    }
    if (sortBy && sortDirection) {
      params['sortBy'] = sortBy;
      params['sortDirection'] = sortDirection.toUpperCase();
    }

    let res;
    res = await this.apiHelperService.getAssesmentList(params);
    this.pageNo = pageNo;

    if (res) {
      this.assesmentList = await this.assessmentService.prepareAssessmentList(res?.assessments ?? []);
      this.dataSource = new MatTableDataSource<any>(this.assesmentList);
      this.totalItems = +(res?.totalItems ?? 0);

      if (pageNo === FIRST_PAGE) {
        if (this.paginator) {
          this.paginator.firstPage();
        }
      }
    }


    setTimeout(() => {
      this.requestLoading = false;
    }, 1000);


  }

  setTablePaginator() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    if (this.paginator)
      this.paginator._intl.itemsPerPageLabel = "Rows per page:";
  }

  onPageChange(event: PageEvent) {
    if (event) {
      this.pageNo = event.pageIndex + 1;
      this.pageSize = event.pageSize;
      this.getAssesmentList(this.pageNo);
    }
  }


  private async loadRisksWithCache(): Promise<void> {
    if (RiskSummaryPageComponent.risksCache) {
      this.risks.set(RiskSummaryPageComponent.risksCache);
      return;
    }
    if (RiskSummaryPageComponent.isLoadingCache && RiskSummaryPageComponent.loadingPromise) {
      this.isLoadingRisks.set(true);
      await RiskSummaryPageComponent.loadingPromise;
      this.isLoadingRisks.set(false);
      if (RiskSummaryPageComponent.risksCache) {
        this.risks.set(RiskSummaryPageComponent.risksCache);
      }
      return;
    }

    RiskSummaryPageComponent.isLoadingCache = true;
    RiskSummaryPageComponent.loadingPromise = this.loadRisksFromAPI();

    try {
      await RiskSummaryPageComponent.loadingPromise;
    } finally {
      RiskSummaryPageComponent.isLoadingCache = false;
      RiskSummaryPageComponent.loadingPromise = null;
    }
  }

  private async loadRisksFromAPI(): Promise<void> {
    this.isLoadingRisks.set(true);
    try {
      const response = await this.apiHelperService.getRisks();

      if (response.success && response.data && response.data.risksWithCategory && Array.isArray(response.data.risksWithCategory)) {
        const allApiRisks: any[] = [];
        response.data.risksWithCategory.forEach((category: any) => {
          if (category.risks && Array.isArray(category.risks)) {
            category.risks.forEach((risk: any) => {
              allApiRisks.push({
                ...risk,
                categoryType: category.categoryType
              });
            });
          }
        });

        const convertedRisks = this.convertApiRisksToRisks(allApiRisks);

        RiskSummaryPageComponent.risksCache = convertedRisks;
        this.risks.set(convertedRisks);
      } else {
        this.snackbarService.openSnack('Failed to load risks. Please try again.', 'OK', 4000);
        this.risks.set([]);
      }
    } catch (error) {
      this.snackbarService.openSnack('Error loading risks. Please check your connection and try again.', 'OK', 4000);
      this.risks.set([]);
    } finally {
      this.isLoadingRisks.set(false);
    }
  }

  private convertApiRisksToRisks(apiRisks: ApiRisk[]): Risk[] {
    return apiRisks.map(apiRisk => ({
      id: apiRisk.id.toString(),
      parameter: {
        id: apiRisk.parameterId.toString(),
        name: apiRisk.parameterName
      },
      category: this.mapCategoryType(apiRisk.categoryType),
      description: apiRisk.description,
      likelihood: this.mapLikelihood(apiRisk.likelihood),
      impact: this.mapImpact(apiRisk.impact),
      riskLevel: RiskData.calculateRiskLevel(
        this.mapLikelihood(apiRisk.likelihood),
        this.mapImpact(apiRisk.impact)
      ),
      createdAt: new Date()
    }));
  }

  private mapCategoryType(categoryType: string): RiskCategory {
    switch (categoryType.toUpperCase().trim()) {
      case 'PROCESSING':
        return RiskCategory.PROCESSING_RISK;
      case 'TRANSFER ':// trailing space required by backend
        return RiskCategory.TRANSFER_RISK;
      case 'AI':
        return RiskCategory.AI_RISK;
      default:
        return RiskCategory.PROCESSING_RISK;
    }
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

  protected onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
    this.activeTab.set(event.index === 0 ? 'risk-summary' : 'assessment');
  }

  protected openRiskDialog(): void {
    const dialogRef = this.dialog.open(RiskDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: false,
      restoreFocus: true,
      panelClass: 'dialog-wrapper',
    });

    dialogRef.afterClosed().subscribe((result: Risk | undefined) => {
      if (result) {
        this.onRiskCreated(result);
      }
    });
  }

  protected onRiskCreated(risk: Risk): void {
    this.clearCache();
    this.loadRisksWithCache();
  }

  protected onRiskDeleted(risk: Risk): void {
    this.clearCache();
    this.loadRisksWithCache();
  }

  private clearCache(): void {
    RiskSummaryPageComponent.risksCache = null;
    RiskSummaryPageComponent.isLoadingCache = false;
    RiskSummaryPageComponent.loadingPromise = null;
  }

  onCreateAssessment() {
    this.onCreateNewAssessment.emit(true)
  }


  protected getRiskLevelClass(riskLevel: RiskLevel): string {
    const classMap: { [key: string]: string } = {
      [RiskLevel.HIGH]: 'text-red-700 bg-red-50',
      [RiskLevel.MEDIUM]: 'text-yellow-800 bg-yellow-100',
      [RiskLevel.LOW]: 'text-green-700 bg-green-100',
    };
    return classMap[riskLevel] || 'text-gray-600 bg-gray-100';
  }

  openDrawers() {
    this.openDrawer.emit({ mode: 'add', data: null });
  }

  onClickName(request: any) {
    const assessmentId = request.id
    this.router.navigate([`${routeConstants.USER}/${routeConstants.ASSESSMENTS}/${routeConstants.ASSESSMENT}/${routeConstants.ASSETS_DETAILS}/${assessmentId}`])
  }

  postLoadAssessment(event: any) {
    this.requestLoading = event.requestLoading;
    this.totalAssessemntCount = event.totalAssessments
  }
}
