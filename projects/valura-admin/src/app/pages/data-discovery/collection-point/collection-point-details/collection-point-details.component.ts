import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { CollectionPointService } from '@admin-core/services/collection-point/collection-point.service';
import { formatStatus } from '@admin-page/task-management/task-utils';
import { formatText } from '@valura-lib/utils/general-utils';
import { UserService } from '@admin-core/services/user/user.service';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { CollectionPointId } from '@admin-core/models/data-inventory/BPA';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { MatDialog } from '@angular/material/dialog';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { statusColors, statusTextColors } from '../../data-discovery-util';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';

interface CollectionPoint {
  id: string;
  name: string;
  description: string;
  type: string;
  sourceType: string;
  linkedBPACount: number;
  linkedPdElementsCount: number;
}

export interface DataElement {
  name: string;
  pdId: number;
  dataCategory: {
    mappingId: number;
    categoryId: number;
    categoryName: string;
  }[];
  dataClassification: {
    mappingId: number;
    classificationId: number;
    classificationName: string;
  }[];
  dataSubjectName?: string;
}

interface LinkedBPA {
  id: string;
  processName: string;
  bpaOwner: string;
  departmentName: string;
  bpaId: number;
}

export interface CollectionPointPdMapping {
  dsId: number;
  pdId: number;
  bpaId: number;
  bpaName: string;
}

interface DataSubjectGroup {
  dsName: string;
  expanded: boolean;
  dataElements: DataElement[];
  dataSource: MatTableDataSource<DataElement>;
}


@Component({
  selector: 'app-collection-point-details',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    CdkAccordionModule,
    LoadingButtonComponent,
    ItemNotFoundComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './collection-point-details.component.html',
  styleUrl: './collection-point-details.component.scss'
})
export class CollectionPointDetailsComponent implements OnInit, AfterViewInit {
  currentPath: string = '';
  selectedTabIndex: number = 0;
  pageSize: number = 10;
  isLoading: boolean = true;
  private location = inject(Location);
  private userService = inject(UserService)
  private departmentService = inject(DepartmentService);

  dataSubjects: DataSubjectGroup[] = [];

  shimmerDataElements: any[] = Array.from({ length: 5 }, (_, i) => ({ shimmerIndex: i }));
  shimmerLinkedBpa: any[] = Array.from({ length: 5 }, (_, i) => ({ shimmerIndex: i }));

  collectionPoint: CollectionPoint = {
    id: '',
    name: '',
    description: '',
    type: '',
    sourceType: '',
    linkedBPACount: 0,
    linkedPdElementsCount: 0
  };

  dataElementsColumns: string[] = ['name', 'dataCategory', 'dataClassification'];
  dataElementsDataSource: MatTableDataSource<DataElement>;
  dataElementsTotalItems: number = 0;

  linkedBpaColumns: string[] = ['id', 'processName', 'bpaOwner', 'DepartMentName', 'VolOfData', 'status'];
  linkedBpaDataSource: MatTableDataSource<LinkedBPA>;
  linkedBpaTotalItems: number = 0;

  currentRequestDetails = {
    vendorId: 0,
    index: 0,
  };
  private navigationDirection: 'prev' | 'next' | null = null;
  hasApiError: boolean = false;
  @ViewChild('dataElementsPaginator') dataElementsPaginator!: MatPaginator;
  @ViewChild('linkedBpaPaginator') linkedBpaPaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  collectionPointID: number = 0;



  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiHelper: ApiHelperService,
    private collectionPointService: CollectionPointService,
    public dialog: MatDialog

  ) {

    this.dataElementsDataSource = new MatTableDataSource<DataElement>([]);
    this.linkedBpaDataSource = new MatTableDataSource<LinkedBPA>([]);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe({
      next: params => {
        let id = params.get('id');
        this.collectionPointID = id ? +(id) : 0
        this.loadCollectionPointDetails(this.collectionPointID);
        this.onInitPage();
      }
    });
  }

  onInitPage(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.updateCurrentRequestIndex()
  }

  async loadCollectionPointDetails(collectionPointID: number): Promise<void> {
    this.isLoading = true;
    this.hasApiError = false;
    try {
      // const collectionPointId = this.route.snapshot.params['id'];

      const response = await this.apiHelper.getCollectionPointDetails(collectionPointID);

      if (!response) {
        this.hasApiError = true;
        return
      }
      if (response) {
        const source = response;

        this.collectionPoint = {
          id: source.id.toString(),
          name: source.sourceName || 'N/A',
          description: 'Collection point for data gathering',
          type: source.type || 'N/A',
          sourceType: source.source_type || 'N/A',
          linkedBPACount: source.sourceBpaMappingsCount || 0,
          linkedPdElementsCount: source.pdMappingsCount || 0
        };


        const dataElements: DataElement[] = await this.collectionPointService.prepareDataElements(source.pdMappings || []);
        this.dataElementsDataSource.data = dataElements;

        this.dataElementsTotalItems = dataElements.length;

        this.prepareDataSubjects(dataElements);

        const linkedBPA: LinkedBPA[] = await Promise.all(
          (source.bpaMappings || []).map(async (bpa: any) => {
            const user = await this.userService.getUserById(
              bpa.bpaOwner?.userId ?? 0
            );
            const department = await this.departmentService.getDepartmentById(bpa.departmentId ?? 0);

            return {
              id: bpa.id?.toString() ?? 'N/A',
              processName: bpa.name ?? 'Unknown Process',
              bpaOwner: user?.displayName ?? 'Unknown Owner',
              bpaId: bpa.bpaId?.toString() ?? '',
              departmentName: department?.name ?? 'N/A',
              status: bpa.status ?? '-',
              volumeOfPersonalData: bpa.volumeOfPersonalData ?? '-'
            };
          })
        );


        this.linkedBpaDataSource.data = linkedBPA;
        this.linkedBpaTotalItems = linkedBPA.length;
      }
    } catch (error) {
      console.error('Error loading collection point details:', error);
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }

  prepareDataSubjects(dataElements: DataElement[]): void {
    const grouped = new Map<string, DataElement[]>();

    dataElements.forEach(el => {
      const dsName = el.dataSubjectName || 'Data Subject';
      if (!grouped.has(dsName)) {
        grouped.set(dsName, []);
      }
      grouped.get(dsName)!.push(el);
    });

    this.dataSubjects = Array.from(grouped.entries()).map(
      ([dsName, elements]) => ({
        dsName,
        expanded: false,
        dataElements: elements,
        dataSource: new MatTableDataSource<DataElement>(elements)
      })
    );
  }

  ngAfterViewInit(): void {
    if (this.dataElementsPaginator) {
      this.dataElementsDataSource.paginator = this.dataElementsPaginator;
      this.dataElementsPaginator._intl.itemsPerPageLabel = "Rows per page:";
    }

    if (this.linkedBpaPaginator) {
      this.linkedBpaDataSource.paginator = this.linkedBpaPaginator;
      this.linkedBpaPaginator._intl.itemsPerPageLabel = "Rows per page:";
    }

    this.dataElementsDataSource.sort = this.sort;
    this.linkedBpaDataSource.sort = this.sort;
  }

  onDataElementsPageChange(event: PageEvent): void {
    if (event) {
      this.pageSize = event.pageSize;
    }
  }

  onLinkedBpaPageChange(event: PageEvent): void {
    if (event) {
      this.pageSize = event.pageSize;
    }
  }
  goBack(): void {
    this.location.back();
  }

  getStatusText(status: string): string {
    return formatText(status)
  }

  viewAssetDetails(row: any, index: number) {
    let path = this.currentPath.split('/').slice(0, -2).join('/')
    const bpaId = row.bpaId;
    this.router.navigate([`${path}/${routeConstants.BPA}/${routeConstants.BPA_DETAILS}`],
      {
        queryParams: {
          bpaRequestId: bpaId,
          mode: 'VIEW'
        },
        state: { bpaIds: this.linkedBpaDataSource.data.map((a: any) => a.bpaId), currentIndex: index, fromCollectionPoint: true }
      })
  }

  async goToPrevRequest() {
    this.currentRequestDetails.index--;
    this.navigationDirection = 'prev';

    if (this.collectionPointService.getPrevRequestShifted()) {
      const tempRequestList = this.collectionPointService.getPrevRequestRid();
      this.collectionPointService.setCOLLPOINTRequestRid(tempRequestList);
      const currentRequestSize = this.collectionPointService.getCollectionPointRid()?.length ?? 0;
      this.currentRequestDetails.index = currentRequestSize - 1;
      this.collectionPointService.setPrevRequestShifted('false');
      this.collectionPointService.setPrevRequestPage(0, true);
    }
    const currentRequest = this.collectionPointService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.id);
    }
  }

  async goToNextRequest() {
    this.currentRequestDetails.index++;
    this.navigationDirection = 'next';

    if (this.collectionPointService.getNextRequestShifted()) {
      const tempNextRequestList = this.collectionPointService.getNextRequestRid();
      this.collectionPointService.setCOLLPOINTRequestRid(tempNextRequestList);
      this.currentRequestDetails.index = 0;
      this.collectionPointService.setNextRequestShifted('false');
      this.collectionPointService.setNextRequestPage(0, true);
    }
    const currentRequest = this.collectionPointService.getNextOrPrevRequestRid(this.currentRequestDetails.index);
    if (currentRequest) {
      this.openNextRequest(currentRequest.id);
    }
  }

  get disablePrevBtn() {
    return this.collectionPointService.getPrevRequestRid()?.length == 0;
  }

  get getPrevRequestRid() {
    return this.collectionPointService.getPrevRequestRid()?.length;
  }

  get disableNextBtn() {
    return this.collectionPointService.getNextRequestRid()?.length == 0;
  }

  openNextRequest(requestRid: number) {
    this.router.navigate([`${this.currentPath}/${requestRid}`])

  }

  async updateCurrentRequestIndex() {
    let requestList = this.collectionPointService.getCollectionPointRid();
    let nodeIndex = requestList.findIndex((request: CollectionPointId) => request.id == this.collectionPointID);
    if (nodeIndex > -1) {
      this.currentRequestDetails.index = nodeIndex;
      await this.loadPrevRequestList();
      await this.loadNextRequestList();
    }
  }

  async loadPrevRequestList() {
    const tempRequestList = this.collectionPointService.getCollectionPointRid();

    if (this.currentRequestDetails.index == 0) {
      let pageData = this.collectionPointService.getNextRequestPageNo(true);
      if (pageData?.exceeded) {
        this.collectionPointService.removePrevRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.collectionPointService.setPrevRequestPage(newPageNo);
      const requestList: CollectionPointId[] = await this.collectionPointService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.collectionPointService.setPrevRequestShifted('true');
        this.collectionPointService.setPrevRequestRid(requestList);
        return;
      }
    }

    this.collectionPointService.setPrevRequestRid(tempRequestList);
    this.collectionPointService.setPrevRequestShifted('false');
  }

  async loadNextRequestList() {
    const tempRequestList = this.collectionPointService.getCollectionPointRid();

    const currentSize = this.collectionPointService.getCollectionPointRid()?.length ?? 0;
    if (currentSize - this.currentRequestDetails.index == 1) {
      let pageData = this.collectionPointService.getNextRequestPageNo();
      if (pageData?.exceeded) {
        this.collectionPointService.removeNextRequestRid();
        return;
      }
      const newPageNo = pageData?.pageNo ? pageData.pageNo : 0;
      this.collectionPointService.setNextRequestPage(newPageNo);
      const requestList: CollectionPointId[] = await this.collectionPointService.getRequestList(newPageNo);
      if (requestList?.length) {
        this.collectionPointService.setNextRequestShifted('true');
        this.collectionPointService.setNextRequestRid(requestList);
        return;
      }
    }

    this.collectionPointService.setNextRequestRid(tempRequestList);
    this.collectionPointService.setNextRequestShifted('false');
  }

  getStatusColors(status: string): string {
    return statusColors(status);
  }

  getStatusTextColors(status: string): string {
    return statusTextColors(status);
  }

  openStepperPopup() {
    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        entityId: this.collectionPointID,
        audit_log_module: AUDIT_LOG_MODULE.DATA_DISCOVERY,
        auditLogs: AUDIT_LOG_ENTITY_TYPE.COLLECTION_POINT
      },
      disableClose: true,
      panelClass: 'dialog-wrapper',
    });
  }
}