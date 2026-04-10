import { Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { CdkAccordionModule } from "@angular/cdk/accordion";
import { MatButtonModule } from "@angular/material/button";
import { MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, NgClass, NgTemplateOutlet, CommonModule } from '@angular/common';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { DataInventoryDialogComponent } from './data-inventory-dialog/data-inventory-dialog.component';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { CategoryItem, DICategory, DIDataSubject, LegalBase, PdElement, Purpose, SourceOfCollection } from '@admin-core/models/DataDiscovery/DataInventory';
import { HEADER_COLLECTION_SOURCE, DataDiscoveryModule, DataInventoryButtonTabs, DataInventoryDrawer, DS_DATA_ELEMENT_HEADER, HEADER_ACTION, HEADER_DATE, HEADER_LEGAL, HEADER_NAME, HEADER_STORAGE } from './constant';
import { MatMenuModule } from '@angular/material/menu';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { DataInventoryService } from '@admin-core/services/data-inventory/data-inventory.service';
import { ROUTE_BACK } from '@admin-core/constants/local-storage-constants';
import { RequestDisplayStage, RequestStageTab } from '@admin-page/request-management/constant';
import { Location } from '@angular/common';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { setItem } from '@valura-lib/utils/local-storage-util';


@Component({
  selector: 'app-data-inventory',
  standalone: true, // Set component to standalone
  imports: [
    CommonModule, // For NgClass, NgIf, DatePipe, etc.
    CdkAccordionModule,
    LoadingButtonComponent,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    NgClass,
    NgTemplateOutlet,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatSidenavModule,
    MatMenuModule,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './data-inventory.component.html',
  styleUrl: './data-inventory.component.scss'
})
export class DataInventoryComponent {

  tableHeaders: any = [];
  displayedHeaders = [];
  dataSource = new MatTableDataSource<any>();
  dataInventoryButtonTabs = DataInventoryButtonTabs;
  selectedSegment: string = this.dataInventoryButtonTabs[0].key;
  selectedDataSubjectIndex: number = 0;
  dataSubjectList: DIDataSubject[] = [];
  selectedDataSubject!: DIDataSubject;
  selectedCategory!: DICategory;
  categoryMasterList: DICategory[] = []
  DataInventoryDrawer = DataInventoryDrawer
  DataDiscoveryModule = DataDiscoveryModule
  isImportNeeded: boolean = false;
  selectedDrawerType: string = ''
  HEADER_DATE = HEADER_DATE
  HEADER_ACTION = HEADER_ACTION
  HEADER_LEGAL = HEADER_LEGAL
  HEADER_NAME = HEADER_NAME
  HEADER_COLLECTION_SOURCE = HEADER_COLLECTION_SOURCE
  HEADER_STORAGE = HEADER_STORAGE
  pdInventoryMasterList: DIDataSubject[] = [];
  private location = inject(Location);

  private dataInventoryService = inject(DataInventoryService);
  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private route = inject(ActivatedRoute);
  detailList: string[] = [];

  @ViewChild('rightDrawer') rightDrawer!: MatDrawer;
  purposeCount: any;
  hasApiError: boolean = false;

  constructor(private router: Router, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isImportNeeded = params['isImportNeeded'] === 'true';
    });
    this.getPdInventoryMasterList()
  }

  addElement() {
    this.router.navigate(['/user/data-discovery/create-data-inventory']);
  }

  dataInventoryImportDialog() {
    this.dialog.open(DataInventoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      width: '80vw',
      maxWidth: '600px',
      height: '85vh',
      panelClass: 'dialog-wrapper',
      disableClose: false
    });

  }

  onSelectSegment(key: string) {
    this.selectedSegment = key
  }

  getCategoryClass(category: DICategory) {
    if (this.selectedCategory?.id === category.id) {
      return `text-primary-40 font-semibold`
    }
    return `text-gray-700`
  }

  searchFilter() {

  }

  // Corrected function to accept a number directly from the template event
  onDataSubjectChange(index: number) {
    this.selectedDataSubjectIndex = index;
    this.setDefaultCategory(this.selectedDataSubjectIndex);
  }

  setDefaultCategory(index: number) {
    this.selectedDataSubject = this.pdInventoryMasterList[index];
    if (this.selectedDataSubject?.categoryList?.length) {
      this.setActiveCategory(this.selectedDataSubject.categoryList[0]);
    }
  }

  async getPdInventoryMasterList() {
    try {
      const res = await this.dataInventoryApiHelperService.pdInventoryMasterList();
      if (!res || res.success == false) { this.hasApiError = true; return }
      if (res) {
        const data = res.items || [];
        const dataSubjectList = await this.dataInventoryService.prepareDataSubjectMappingList(data);
        this.pdInventoryMasterList = [...dataSubjectList];
        this.selectedDataSubjectIndex = 0;
        if (this.pdInventoryMasterList?.length) {
          this.setDefaultCategory(0)
        }
      }
    }
    catch (e) { this.hasApiError = true }
  }

  async getDataSubjectList() {
    const res = await this.configApiHelperService.getDataSubjectList();
    if (res) {
      this.dataSubjectList = res.dataSubjects || [];
      this.selectedDataSubjectIndex = 0
    }
  }

  async getPdCategories(selectedDataSubject: any = null) {
    if (selectedDataSubject.categoryList?.length) {
      return
    }

    if (this.categoryMasterList?.length) {
      selectedDataSubject.categoryList = [...this.categoryMasterList];
      return
    }

    const res = await this.configApiHelperService.getPdCategories();
    if (res) {
      const pdCategories = res?.pdCategories ? res.pdCategories : [];
      this.categoryMasterList = [...pdCategories]
      selectedDataSubject.categoryList = [...pdCategories];
      if (selectedDataSubject.categoryList?.length) {
        this.setActiveCategory(selectedDataSubject.categoryList[0])
      }
    }
  }

  setActiveCategory(item: DICategory) {
    this.selectedCategory = item;
    // this.getPdElements()
  }


  async getPdElements(selectedCategory: any) {
    if (selectedCategory.pdElementList?.length) {
      return
    }
    const params = {
      categoryIds: [this.selectedCategory?.id ?? 0]
    }
    const data = await this.configApiHelperService.getPDElements(params);
    const pdElements = data?.pdElements ? data.pdElements : [];
    selectedCategory.pdElementList = [...pdElements]
  }

  async onExpandPdElement(pdElement: PdElement) {
    pdElement.expanded = !pdElement.expanded;
    if (pdElement.expanded) {
      if (!pdElement.purposesLoaded) {
        const purposeList = await this.dataInventoryService.preparePurposeList(pdElement.purposes);
        pdElement.purposes = [...purposeList];
        pdElement.purposesLoaded = true;
      }
      this.setTableInfo(pdElement);
    }
  }

  setTableInfo(pdElement: PdElement) {
    const tableHeaders = DS_DATA_ELEMENT_HEADER
    pdElement.tableHeaders = tableHeaders;
    pdElement.dataSource = new MatTableDataSource<any>();
    if (tableHeaders?.length)
      pdElement.displayedHeaders = tableHeaders.map((c: any) => c.columnDef);
    pdElement.dataSource = new MatTableDataSource(pdElement.purposes);
  }

  async getPdElementsMapping(pdElement: PdElement) {
    if (pdElement.purposes?.length) {
      return
    }
    pdElement.purposes = [...pdElement.purposes]
  }

  onClickName(row: any) {

  }

  dsHasCategory(selectedDataSubject: DIDataSubject) {
    return selectedDataSubject?.categoryList?.length ?? 0
  }

  addNewPdElement() {
    this.selectedDrawerType = DataInventoryDrawer.DATA_ELEMENT
    this.rightDrawer.open();
  }

  closeDrawer() {
    this.rightDrawer.toggle()
    this.selectedDrawerType = ''
  }

  getLegalBasisName(legalBase: LegalBase[]) {
    return `${legalBase?.length ? `${legalBase?.[0]?.name} ${legalBase.length > 1 ? `(+${legalBase.length - 1})` : ``}` : `-`}`;
  }

  getCollectionSourcename(sourceOfCollection: SourceOfCollection[]) {
    return `${sourceOfCollection?.length ? `${sourceOfCollection?.[0]?.collectionPoint} ${sourceOfCollection.length > 1 ? `(+${sourceOfCollection.length - 1})` : ``}` : `-`}`;
  }

  getStorageLocation(purpose: Purpose) {
    const storageLocation = [...(purpose?.internalStorage ?? []), ...(purpose?.externalStorage ?? [])]
    return `${storageLocation?.length ? `${storageLocation?.[0]?.name} ${storageLocation.length > 1 ? `(+${storageLocation.length - 1})` : ``}` : `-`}`;
  }

  showDetail(detailList: any[]) {
    return detailList?.length > 1 ? true : false;
  }

  showLegalBasisName(legalBase: LegalBase[]) {
    this.detailList = []
    if (this.showDetail(legalBase)) {
      this.detailList = (legalBase ?? []).map(legal => (legal?.name ?? ''))
      return
    }
  }

  showCollectionSourcename(sourceOfCollection: SourceOfCollection[]) {
    this.detailList = []
    if (this.showDetail(sourceOfCollection)) {
      this.detailList = (sourceOfCollection ?? []).map(source => (source?.collectionPoint ?? ''))
      return
    }
  }

  showStorageName(purpose: Purpose) {
    this.detailList = []
    const storageLocation = [...(purpose?.internalStorage ?? []), ...(purpose?.externalStorage ?? [])]
    if (this.showDetail(storageLocation)) {
      this.detailList = (storageLocation ?? []).map(storage => (storage?.name ?? ''))
      return
    }
  }

  showStorageDetails(purpose: Purpose) {
    const storageLocation = [...(purpose?.internalStorage ?? []), ...(purpose?.externalStorage ?? [])]
    return storageLocation?.length > 1 ? true : false;
  }

  goBack(): void {
    setItem(ROUTE_BACK, RequestDisplayStage.REQUEST_FULFILLMENT)
    this.location.back();
  }
}

