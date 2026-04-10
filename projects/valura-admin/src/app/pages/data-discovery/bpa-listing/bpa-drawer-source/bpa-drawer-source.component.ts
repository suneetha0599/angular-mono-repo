import { Component, EventEmitter, inject, Input, Output, ViewChild, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, } from '@angular/material/icon';
import { MatSelectModule, MatSelect, MatSelectChange, MatOption } from '@angular/material/select';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { CreateBpaTabKey, BpaDrawerViewType, COLLECTION_POINT_TYPE, FIRST_PAGE, PAGE_SIZE, DrawerMode, BPA_ASEET_DATA_ELEMENT_DRAWER_HEADERS, BPA_SOURCE_DRAWER_HEADERS, ASSET_TYPE_ENUM, BPA_EXTERNAL_WINDOW, ASSET_TYPE } from '../constants';
import { ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { PdElementMapping, SourcetPdElementMapping, PdElement, BpaCategory, BpaDataSubject, BpaSource, BpaSourceCollectionPoint } from '@admin-core/models/data-inventory/BPA';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { AddCategoryDialogComponent } from '../../data-discovery-dialog/add-category-dialog/add-category-dialog.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Asset, Vendor } from '@admin-core/models/data-inventory/Asset';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { displayStatusText, getPdElementMasterList, sensitivityColors, sensitivityTextColors } from '../bpa-utils';
import { MatSortModule } from '@angular/material/sort';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ConfigService } from '@admin-core/services/config.service';
import { HOSTING_SITE } from '../../consent-assets/constant';
import { CategoryService } from '@admin-core/services/category/category.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

@Component({
  selector: 'bpa-drawer-source',
  standalone: true,
  imports: [LoadingButtonComponent, MatCheckbox, MatFormFieldModule, MatInputModule, MatIcon, MatIconButton, MatLabel, MatOption, MatSelect,
    FormsModule, NgStyle, MatSortModule, MatTableModule, NgTemplateOutlet, MatButtonModule, ReactiveFormsModule, MatRadioButton,
    MatSelectModule, MatRadioModule, ScrollingModule, NgClass, MatAutocompleteModule],
  templateUrl: './bpa-drawer-source.component.html',
  styleUrl: './bpa-drawer-source.component.scss'
})

export class BpaDrawerSourceComponent implements OnInit, OnChanges {

  @Input() drawerMode: string = DrawerMode.MAPPING;
  @Input() createBpaForm!: FormGroup;
  @Input() sourcePdElementsMappingList: SourcetPdElementMapping[] = []
  @Input() selectedSourceIndex: number = -1

  @Output() onCloseDrawer = new EventEmitter<any>()
  @Output() onApplyChanges = new EventEmitter<any>()
  @Output() onOpenExternalWindow = new EventEmitter<any>();
  @Output() onAddNewDataElements = new EventEmitter<any>();

  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport
  searchValue: string = ''
  CreateBpaTabKey = CreateBpaTabKey;
  BpaDrawerViewType = BpaDrawerViewType
  bpaSourceAssetList: Asset[] = [];
  collectionPointMasterList: BpaSourceCollectionPoint[] = [];
  selectedSource!: BpaSourceCollectionPoint | null;
  tempSourcePdElementMapping: SourcetPdElementMapping[] = [];
  filteredSourcePdElementMapping: SourcetPdElementMapping[] = [];
  totalSelected: number = 0
  isLoading: boolean = false;
  tableHeaders: any = [];
  displayedHeaders = [];
  datasource = new MatTableDataSource<any>();
  selectAll: boolean = false;
  showSearch: boolean = false;
  TABLE_VIEW = 'TABLE_VIEW'
  ADD_VIEW = 'ADD_VIEW'
  viewType: string = this.TABLE_VIEW
  assetForm!: FormGroup
  collectionPointForm!: FormGroup
  isSubmitLoading: boolean = false;
  pdElementMappingMasterList: PdElementMapping[] = []
  DrawerMode = DrawerMode;
  tempSourcePdElementList: PdElementMapping[] = [];
  bpaCategoriesList: BpaCategory[] = []
  pdElementForm!: FormGroup
  isAssetMode: boolean = true;
  categoriesList: any[] = [];
  vendorsList: Vendor[] = [];
  hostingTypesList = HOSTING_SITE
  COLLECTION_POINT_TYPE = COLLECTION_POINT_TYPE
  ASSET_TYPE = ASSET_TYPE
  pageSize: number = PAGE_SIZE;
  FIRST_PAGE = FIRST_PAGE;
  page: number = FIRST_PAGE;
  totalRecords: number = 0;
  loading = false;
  newCollectionPointType: string = COLLECTION_POINT_TYPE[0].key;
  COLLECTION_POINT = "COLLECTION_POINT";
  ASSET = "ASSET";
  filteredLocationList: { id: number; name: string }[] = [];
  locationMasterList: any[] = [];

  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private snackbarService = inject(SnackbarService);
  private bpaService = inject(BpaService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private configService = inject(ConfigService);
  private categoryService = inject(CategoryService);

  constructor(private fb: FormBuilder,) {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data) {
        this.onPostMessage(event.data)
      }
    });
  }


  ngOnInit() {
    this.getInitialConfiguration()
    this.setPdElementMasterList()
    this.getBpaSourceAssetList();
    this.getCollectionPointMasterList();
    this.loadCategories();
    this.loadVendors();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['drawerMode'] && this.drawerMode) {
      this.buildForm();
      return
    }
    if (changes['selectedSourceIndex'] && this.selectedSourceIndex > -1) {
      this.buildForm();
    }
  }

  buildForm() {
    if (this.drawerMode == DrawerMode.MAPPING) {
      this.viewType = this.TABLE_VIEW;
      this.assetForm = this.fb.group({
        newAssetName: [''],
        newAssetType: [ASSET_TYPE_ENUM.INTERNAL],
        newAssetCategory: [''],
        newAssetHostingLocation: [''],
        newAssetHostingType: [''],
        newAssetVendor: [''],
      });
      this.collectionPointForm = this.fb.group({
        newCollectionPointName: [''],
        newCollectionPointType: ['']
      });
      this.setPdElementMasterList()
      this.setTableData()
    }
    else if (this.drawerMode == DrawerMode.PD_MAPPING) {
      this.viewType = this.TABLE_VIEW;
      this.pdElementForm = this.fb.group({
        pdElementName: ['', Validators.required],
        pdElementCategory: [null, Validators.required],
        dataSubject: [null, Validators.required],
      })
      this.getCategories()
      this.setPdElementMasterList()
      this.setTableData()
    }
  }

  onToggleChange(isAsset: boolean) {
    if (this.isAssetMode === isAsset) return;
    this.isAssetMode = isAsset;
    this.resetNewItemFields();
    this.cdr.detectChanges();
  }

  async getCategories() {
    const data = await this.categoryService.getPdCategoryMasterList();
    this.bpaCategoriesList = data
  }

  onCloseClick() {
    if (this.viewType == this.ADD_VIEW) {
      this.viewType = this.TABLE_VIEW;
      return
    }
    this.close()
  }

  close() {
    this.onCloseDrawer.emit(true)
  }

  get dataElements() {
    return this.createBpaForm.get('dataElements')?.value
  }

  get overviewForm(): FormGroup {
    return this.createBpaForm.get('overview') as FormGroup;
  }

  get dataSubjectList() {
    return this.overviewForm.get('dataSubjectList')?.value ?? []
  }

  get dataSubjectPdElementMapping() {
    return this.dataElements?.dataSubjectPdElementMapping ?? []
  }

  get assetPdElementList() {
    return (this.sourcePdElementsMappingList?.[this.selectedSourceIndex]?.pdElementMappingList) ?? []
  }

  async onSourceChange(event: MatSelectChange) {
    let findInTemp = this.tempSourcePdElementMapping.find(source => source.source?.id === (this.isAssetMode ? this.selectedSource?.assetId : this.selectedSource?.id));
    let findInExistingMapping = this.sourcePdElementsMappingList.find(sourceMap => sourceMap.source?.id === (this.isAssetMode ? this.selectedSource?.assetId : this.selectedSource?.id));
    if (findInTemp || findInExistingMapping) {
      return
    }
    const sourcePdElementMapping = new SourcetPdElementMapping({ selected: false, pdElementMappingList: [], type: (this.selectedSource?.type ?? '') })

    sourcePdElementMapping.source = new BpaSource(this.isAssetMode ? {
      id: this.selectedSource?.assetId,
      name: this.selectedSource?.name,
      sourceType: this.ASSET,
      type: this.selectedSource?.assetType,
    } :
      {
        id: this.selectedSource?.id,
        name: this.selectedSource?.collectionPoint,
        sourceType: this.COLLECTION_POINT,
        type: this.selectedSource?.type,
      });
    sourcePdElementMapping.pdElementMappingList = []
    this.tempSourcePdElementMapping.push({ ...sourcePdElementMapping });
    this.filteredSourcePdElementMapping = [...this.tempSourcePdElementMapping]

    this.calculateSelectedValues();
    this.prepareDataSource()
  }

  async getBpaAssetMasterList(page: number = FIRST_PAGE) {
    if (this.loading) return;
    this.loading = true;
    this.page = page;

    const params = { page: page, size: PAGE_SIZE };
    const data = await this.dataInventoryApiHelperService.getBpaAsset(params);

    if (page === FIRST_PAGE) {
      this.bpaSourceAssetList = [];
      this.totalRecords = data?.totalElements ?? 0;
    }

    this.bpaSourceAssetList = [...this.bpaSourceAssetList, ...(data?.assets ?? [])];
    this.loading = false;
  }

  async loadMoreAssets(assetSelect: MatSelect) {
    if (!assetSelect?.panelOpen || this.loading) return;

    const hasMore = this.bpaSourceAssetList.length < this.totalRecords;
    if (!hasMore) return;

    this.page++;

    await this.getBpaAssetMasterList(this.page);
  }

  setPdElementMasterList() {
    this.pdElementMappingMasterList = getPdElementMasterList(this.dataSubjectPdElementMapping);

    if (this.drawerMode == DrawerMode.PD_MAPPING) {
      // const newPdElementData = (this.sourcePdElementsMappingList?.[this.selectedSourceIndex]?.sourceNewPdElementMasterList) ?? [];
      this.tempSourcePdElementList = [...this.pdElementMappingMasterList];

      for (const pdElement of this.tempSourcePdElementList) {
        let find = this.assetPdElementList.find(assetPdEle => (assetPdEle.pdElement?.id == pdElement.pdElement?.id) && (assetPdEle.dataSubject?.id == pdElement.dataSubject?.id));
        pdElement.selected = find ? true : false;
      }
      this.calculateSelectedValues()
    }
  }

  calculateSelectedValues() {
    let totalCount = 0;
    if (this.drawerMode == DrawerMode.PD_MAPPING) {
      for (const pdElemementMapping of this.tempSourcePdElementList) {
        if (pdElemementMapping.selected) {
          totalCount += 1;
        }
      }
    }
    else if (this.drawerMode == DrawerMode.MAPPING) {
      for (const sourceElemementMapping of this.tempSourcePdElementMapping) {
        if (sourceElemementMapping.selected) {
          totalCount += 1;
        }
      }
    }
    this.totalSelected = +(totalCount ?? 0)
  }

  getSensitivityColors(status: string): string {
    return sensitivityColors(status);
  }

  getSensitivityText(status: string): string {
    return displayStatusText(status);
  }

  getSensitivityTextColors(status: string): string {
    return sensitivityTextColors(status);
  }

  onChangeEvent(pdElementMapping: PdElementMapping) {
    this.calculateSelectedValues()
  }

  onChangeSelectAll(event: MatCheckboxChange) {
    const checked = event.checked
    if (this.drawerMode == DrawerMode.MAPPING) {
      for (const assetElementMapping of this.tempSourcePdElementMapping) {
        assetElementMapping.selected = checked
      }
      this.filteredSourcePdElementMapping = [...this.tempSourcePdElementMapping];
    }
    else if (this.drawerMode == DrawerMode.PD_MAPPING) {
      for (const pdElementMapping of this.tempSourcePdElementList) {
        pdElementMapping.selected = checked
      }
    }
    this.calculateSelectedValues()
  }

  onApplyClick() {
    if (this.viewType == this.ADD_VIEW) {
      if (this.drawerMode == DrawerMode.MAPPING) {
        if (this.isAssetMode) {
          this.addNewAsset();
          return
        }
        this.addNewCollectionPoint()
      }
      else if (this.drawerMode == DrawerMode.PD_MAPPING) {
        this.savePdElements()
      }
      return
    }
    const pdElementMasterList = this.tempSourcePdElementList.filter(pdEle => pdEle.selected);
    const newPdElementList = this.tempSourcePdElementList.filter(pdEle => pdEle.newAdded);

    this.onApplyChanges.emit({
      sourcePdElementsMappingList: this.tempSourcePdElementMapping,
      sourcePdElementList: pdElementMasterList,
      newPdElementList: newPdElementList,
      drawerMode: this.drawerMode
    });
    this.clearData()
  }

  searchPdElements() {
    this.filteredSourcePdElementMapping = this.tempSourcePdElementMapping.filter((item: SourcetPdElementMapping) => {
      return (item.source?.name.trim().toLowerCase().includes(this.searchValue.trim().toLowerCase()))
    })
    if (!this.searchValue) {
      this.filteredSourcePdElementMapping = [...this.tempSourcePdElementMapping];
    }
  }

  clearData() {
    this.tempSourcePdElementMapping = [];
    this.filteredSourcePdElementMapping = [];
    this.selectedSource = null;
    this.calculateSelectedValues();
    this.datasource = new MatTableDataSource<PdElementMapping[]>;
    this.selectAll = false
  }

  setTableData() {

    if (this.drawerMode == DrawerMode.MAPPING) {
      this.datasource = new MatTableDataSource<SourcetPdElementMapping[]>;
      this.tableHeaders = BPA_SOURCE_DRAWER_HEADERS;
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.key);
    }
    else if (this.drawerMode == DrawerMode.PD_MAPPING) {
      this.datasource = new MatTableDataSource<PdElementMapping[]>;
      this.tableHeaders = BPA_ASEET_DATA_ELEMENT_DRAWER_HEADERS;
      this.displayedHeaders = this.tableHeaders.map((c: any) => c.key);
    }
    this.prepareDataSource()
  }

  prepareDataSource() {
    if (this.drawerMode == DrawerMode.MAPPING) {
      this.datasource = new MatTableDataSource(this.filteredSourcePdElementMapping);
    }
    else if (this.drawerMode == DrawerMode.PD_MAPPING) {
      this.datasource = new MatTableDataSource(this.tempSourcePdElementList);
    }
  }

  onAddNew() {
    if (this.drawerMode == DrawerMode.PD_MAPPING) {
      const type = BPA_EXTERNAL_WINDOW.SOURCE_ELEMENT_PD;
      this.onOpenExternalWindow.emit({ type: type });
      return
    }
    this.viewType = this.ADD_VIEW
  }

  toggleSearch() {
    this.showSearch = !this.showSearch
  }

  clearSearch() {
    this.searchValue = ''
  }

  savePdElements() {
    if (this.pdElementForm.invalid) {
      this.snackbarService.openSnack(`Please fill the required details!`);
      return
    }
    const category: BpaCategory = this.pdElementForm.get('pdElementCategory')?.value;
    const dataSubject: BpaDataSubject = this.pdElementForm.get('dataSubject')?.value;

    const body = {
      "name": this.pdElementForm.get('pdElementName')?.value ?? '',
      "categoryId": category.id ?? 0
    }
    this.isSubmitLoading = true
    this.dataInventoryApiHelperService.addNewPdElements(body)
      .subscribe({
        next: async (res) => {
          this.isSubmitLoading = false;
          this.selectedSource = null;
          this.addPdElementsToMasterList(res, category, dataSubject)
          this.viewType = this.TABLE_VIEW;
          this.pdElementForm.reset();
        },
        error: (e: Error) => {
          console.error(e.message);
          this.isSubmitLoading = false
        },
      });
  }

  addPdElementsToMasterList(pdElement: PdElement, category: BpaCategory, dataSubject: BpaDataSubject) {
    const pdElementMapping = new PdElementMapping({ purpose: [], selected: true, newAdded: true });
    pdElementMapping.pdElement = { ...pdElement, categoryId: [category.id], categoryName: [category.name], sensitivity: category.sensitivity };
    pdElementMapping.dataSubject = { ...dataSubject };
    this.tempSourcePdElementList.push(pdElementMapping)
  }

  resetNewItemFields() {
    this.assetForm.reset()
    this.collectionPointForm.reset();
    this.newCollectionPointType = COLLECTION_POINT_TYPE[0].key;
  }

  async addNewAsset() {
    const formValue = this.assetForm.value;
    try {
      const siteValue = formValue.newAssetHostingType.replace(' ', '_').toUpperCase();

      const payload = {
        name: formValue.newAssetName.trim(),
        description: `Asset created from BPA Drawer: ${formValue.newAssetName.trim()}`,
        assetType: formValue.newAssetType as 'INTERNAL' | 'EXTERNAL',
        assetUrl: "",
        assetCategoryId: Number(formValue.newAssetCategory),
        securityMeasures: [],
        departmentId: 0,
        systemOwner: "",
        vendorId: Number(formValue.newAssetVendor),
        hostingDetails: [
          {
            site: siteValue,
            name: formValue.newAssetName.trim(),
            location: (formValue.newAssetHostingLocation?.id ?? 0)
          }
        ]
      };
      await this.dataInventoryApiHelperService.createBpaAsset(payload as any);
      await this.getBpaAssetMasterList();
      this.cancelAddNewItem();

    } catch (error) {
      console.error("Failed to add new asset:", error);
    }
  }

  async addNewCollectionPoint() {
    const collectionPointData = this.collectionPointForm.value;
    if (collectionPointData.newCollectionPointName.trim() && collectionPointData.newCollectionPointType) {
      try {
        const payload = {
          assetId: 0,
          type: collectionPointData.newCollectionPointType,
          collectionPoint: collectionPointData.newCollectionPointName.trim(),
          sourceType: this.COLLECTION_POINT
        };
        await this.dataInventoryApiHelperService.createBpaSource(payload);
        await this.getCollectionPointMasterList();
        this.cancelAddNewItem();
      } catch (error) { }
    }
  }

  cancelAddNewItem() {
    this.resetNewItemFields();
    this.cdr.detectChanges();
  }


  getTypeBadgeClass(type: string) {
    if (type.toLowerCase() === COLLECTION_POINT_TYPE[0].key.toLowerCase()) {
      return 'type-internal';
    }
    if (type.toLowerCase() === COLLECTION_POINT_TYPE[1].key.toLowerCase()) {
      return 'type-external';
    }
    return 'type-default';
  }

  async loadCategories() {
    try {
      const response = await this.dataInventoryApiHelperService.getCategorises();
      this.categoriesList = response?.assetCategories || [];
    } catch (error) {
      this.categoriesList = [];
    }
  }

  async loadVendors() {
    try {
      const response = await this.dataInventoryApiHelperService.getVendors();
      this.vendorsList = response?.vendorDetails || [];
    } catch (error) {
      this.vendorsList = [];
    }
  }

  async addNewCategory() {
    const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      width: '400px',
      panelClass: 'dialog-wrapper',

      data: { type: 'category' }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.dataInventoryApiHelperService.addCategory(result);
          await this.loadCategories();
        } catch (error) { }
      }
    });
  }

  getAssetNameByIndex(index: number): string {
    const assetMapping = this.sourcePdElementsMappingList?.[index];
    if (assetMapping?.source?.name) {
      return assetMapping.source.name;
    }
    return 'Source';
  }

  get isEditMode() {
    return this.bpaService.isEditMode
  }

  get currentDropdownLabel(): string {
    return this.isAssetMode ? 'Assets' : 'Collection Points';
  }

  get currentMasterList(): Asset[] | BpaSourceCollectionPoint[] {
    return this.isAssetMode ? this.bpaSourceAssetList : this.collectionPointMasterList;
  }

  async getBpaSourceAssetList(page: number = FIRST_PAGE) {
    if (this.loading) return;
    this.loading = true;
    this.page = page;

    const params = { page: page, size: PAGE_SIZE };
    const data = await this.dataInventoryApiHelperService.getBpaAsset(params);

    if (page === FIRST_PAGE) {
      this.bpaSourceAssetList = [];
      this.totalRecords = data?.totalElements ?? 0;
    }

    this.bpaSourceAssetList = [...this.bpaSourceAssetList, ...(data?.assets ?? [])];
    this.loading = false;
  }

  async getCollectionPointMasterList() {
    try {
      const params = { sourceType: this.COLLECTION_POINT };
      const response = await this.dataInventoryApiHelperService.getBpaSource(params);
      this.collectionPointMasterList = (response?.sources ?? [])
    } catch (error) {
      this.collectionPointMasterList = [];
    }
  }

  removeSource(index: number) {

  }

  onPostMessage(res: any) {
    if (res.type == BPA_EXTERNAL_WINDOW.SOURCE_ELEMENT_PD) {
      const pdElementMapping: PdElementMapping = res?.data ?? null;
      if (pdElementMapping) {
        let findInTemp = this.tempSourcePdElementList.find(pdEle => pdEle.pdElement?.id === pdElementMapping.pdElement?.id);
        if (!findInTemp) {
          this.tempSourcePdElementList.push(pdElementMapping);
          this.prepareDataSource()
        }
        this.onAddNewDataElements.emit({ pdElementMapping: pdElementMapping })
      }
    }
  }

  async getInitialConfiguration() {
    const res = await this.configService.getDsrConfiguration();
    if (res) {
      this.locationMasterList = res.countryList || [];
      this.filteredLocationList = [...this.locationMasterList];
    }
    return;
  }

  filterLocations(search: string) {
    if (!search) {
      this.filteredLocationList = [...this.locationMasterList];
      return;
    }

    const lowerSearch = search.toLowerCase();
    this.filteredLocationList = this.locationMasterList.filter(loc =>
      loc.name.toLowerCase().includes(lowerSearch)
    );
  }


  displayLocationName(location?: { id: number; name: string }): string {
    return location ? location.name : '';
  }

}
