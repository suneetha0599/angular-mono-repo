import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { CreateBpaTabKey, BpaDrawerViewType, BPA_ASEET_DRAWER_HEADERS, DrawerMode, BPA_ASEET_DATA_ELEMENT_DRAWER_HEADERS, PAGE_SIZE, FIRST_PAGE, ASSET_TYPE_ENUM, BPA_EXTERNAL_WINDOW } from '../constants';
import { ApiHelperService, ApiHelperService as DataInventoryApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { PdElementMapping, BpaAsset, AssetPdElementMapping, BpaCategory, PdElement, BpaDataSubject, DataSubjectPdElemementMapping, } from '@admin-core/models/data-inventory/BPA';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { displayStatusText, getPdElementMasterList, sensitivityColors, sensitivityTextColors } from '../bpa-utils';
import { Asset, Vendor } from '@admin-core/models/data-inventory/Asset';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { AddCategoryDialogComponent } from '../../data-discovery-dialog/add-category-dialog/add-category-dialog.component';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { HOSTING_SITE } from '../../consent-assets/constant';
import { ConfigService } from '@admin-core/services/config.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CategoryService } from '@admin-core/services/category/category.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

@Component({
  selector: 'bpa-drawer-asset',
  imports: [LoadingButtonComponent, MatCheckbox, MatFormFieldModule, MatInputModule, MatIcon, MatIconButton, MatLabel, MatOption, MatSelect,
    FormsModule, NgStyle, MatSortModule, MatTableModule, NgTemplateOutlet, MatButtonModule, ReactiveFormsModule, MatRadioButton,
    MatSelectModule, MatRadioModule, ScrollingModule, MatAutocompleteModule],
  templateUrl: './bpa-drawer-asset.component.html',
  styleUrl: './bpa-drawer-asset.component.scss'
})
export class BpaDrawerAssetComponent {
  @Input() drawerMode: string = DrawerMode.MAPPING;
  @Input() createBpaForm!: FormGroup;
  @Input() assetPdElementsMappingList: AssetPdElementMapping[] = []
  @Input() selectedAssetIndex: number = -1

  @Output() onCloseDrawer = new EventEmitter<any>()
  @Output() onApplyChanges = new EventEmitter<any>()
  @Output() onOpenExternalWindow = new EventEmitter<any>();
  @Output() onAddNewDataElements = new EventEmitter<any>();

  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport

  searchValue: string = ''
  CreateBpaTabKey = CreateBpaTabKey;
  BpaDrawerViewType = BpaDrawerViewType
  bpaSourceMasterList: Asset[] = []
  selectedAsset!: Asset | null;
  tempSelectedAsset!: Asset | null;
  tempAssetPdElementMapping: AssetPdElementMapping[] = [];
  filteredAssetPdElementMapping: AssetPdElementMapping[] = [];
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
  isSubmitLoading: boolean = false;
  pdElementMappingMasterList: PdElementMapping[] = []
  DrawerMode = DrawerMode;
  tempAssetPdElementList: PdElementMapping[] = [];
  bpaCategoriesList: BpaCategory[] = []
  pdElementForm!: FormGroup
  showAddInput: boolean = false;
  categoriesList: any[] = [];
  vendorsList: Vendor[] = [];
  hostingTypesList = HOSTING_SITE
  pageSize: number = PAGE_SIZE;
  FIRST_PAGE = FIRST_PAGE;
  page: number = FIRST_PAGE;
  totalRecords: number = 0;
  loading = false;
  filteredLocationList: { id: number; name: string }[] = [];
  locationMasterList: any[] = [];

  private dataInventoryApiHelperService = inject(DataInventoryApiHelperService);
  private apiHelperService = inject(ApiHelperService);
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
    this.getBpaAssetMasterList()
    this.setTableData()
    this.loadCategories();
    this.loadVendors();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['drawerMode'] && this.drawerMode) {
      this.buildForm();
      return
    }
    if (changes['selectedAssetIndex'] && this.selectedAssetIndex > -1) {
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

      })
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
    return (this.assetPdElementsMappingList?.[this.selectedAssetIndex]?.pdElementMappingList) ?? []
  }

  async onAssetChange(event: MatSelectChange) {
    let findInTemp = this.tempAssetPdElementMapping.find(assetMap => assetMap.asset?.id === this.selectedAsset?.assetId);
    let findInExistingMapping = this.assetPdElementsMappingList.find(assetMap => assetMap.asset?.id === this.selectedAsset?.assetId);
    if (findInTemp || findInExistingMapping) {
      return
    }
    const assetPdElementMapping = new AssetPdElementMapping({ selected: false, pdElementMappingList: [] })
    const hostingSite: any = this.selectedAsset?.hostingSite;

    assetPdElementMapping.asset = new BpaAsset({
      id: this.selectedAsset?.assetId,
      name: this.selectedAsset?.name,
      type: this.selectedAsset?.assetType,
      categoryName: this.selectedAsset?.assetCategory,
      hostingSite: hostingSite
    });
    assetPdElementMapping.pdElementMappingList = []
    this.tempAssetPdElementMapping.push({ ...assetPdElementMapping });
    this.filteredAssetPdElementMapping = [...this.tempAssetPdElementMapping]

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
      this.bpaSourceMasterList = [];
      this.totalRecords = data?.totalElements ?? 0;
    }

    this.bpaSourceMasterList = [...this.bpaSourceMasterList, ...(data?.assets ?? [])];
    this.loading = false;
  }

  async loadMoreAssets(assetSelect: MatSelect) {
    if (!assetSelect?.panelOpen || this.loading) return;

    const hasMore = this.bpaSourceMasterList.length < this.totalRecords;
    if (!hasMore) return;

    this.page++;

    await this.getBpaAssetMasterList(this.page);
  }

  setPdElementMasterList() {
    this.pdElementMappingMasterList = getPdElementMasterList(this.dataSubjectPdElementMapping);

    if (this.drawerMode == DrawerMode.PD_MAPPING) {
      // const newPdElementData = (this.assetPdElementsMappingList?.[this.selectedAssetIndex]?.assetNewPdElementMasterList) ?? [];
      this.tempAssetPdElementList = [...this.pdElementMappingMasterList];

      for (const pdElement of this.tempAssetPdElementList) {
        let find = this.assetPdElementList.find(assetPdEle => (assetPdEle.pdElement?.id == pdElement.pdElement?.id) && (assetPdEle.dataSubject?.id == pdElement.dataSubject?.id));
        pdElement.selected = find ? true : false;
      }
      this.calculateSelectedValues()
    }
  }

  calculateSelectedValues() {
    let totalCount = 0;
    if (this.drawerMode == DrawerMode.PD_MAPPING) {
      for (const pdElemementMapping of this.tempAssetPdElementList) {
        if (pdElemementMapping.selected) {
          totalCount += 1;
        }
      }
    }
    else if (this.drawerMode == DrawerMode.MAPPING) {
      for (const assetEleMapping of this.tempAssetPdElementMapping) {
        if (assetEleMapping.selected) {
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
      for (const assetElementMapping of this.tempAssetPdElementMapping) {
        assetElementMapping.selected = checked
      }
      this.filteredAssetPdElementMapping = [...this.tempAssetPdElementMapping];
    }
    else if (this.drawerMode == DrawerMode.PD_MAPPING) {
      for (const pdElementMapping of this.tempAssetPdElementList) {
        pdElementMapping.selected = checked
      }
    }
    this.calculateSelectedValues()
  }

  onApplyClick() {
    if (this.viewType == this.ADD_VIEW) {
      if (this.drawerMode == DrawerMode.MAPPING) {
        this.addNewAsset();
      }
      else if (this.drawerMode == DrawerMode.PD_MAPPING) {
        this.savePdElements()
      }
      return
    }
    const pdElementMasterList = this.tempAssetPdElementList.filter(pdEle => pdEle.selected);
    const newPdElementList = this.tempAssetPdElementList.filter(pdEle => pdEle.newAdded);

    this.onApplyChanges.emit({
      assetPdElementsMappingList: this.tempAssetPdElementMapping,
      assetPdElementList: pdElementMasterList,
      newPdElementList: newPdElementList,
      drawerMode: this.drawerMode
    });
    this.clearData()
  }

  searchPdElements() {
    this.filteredAssetPdElementMapping = this.tempAssetPdElementMapping.filter((item: AssetPdElementMapping) => {
      return (item.asset?.name.trim().toLowerCase().includes(this.searchValue.trim().toLowerCase()))
    })
    if (!this.searchValue) {
      this.filteredAssetPdElementMapping = [...this.tempAssetPdElementMapping];
    }
  }

  clearData() {
    this.tempAssetPdElementMapping = [];
    this.filteredAssetPdElementMapping = [];
    this.selectedAsset = null;
    this.calculateSelectedValues();
    this.datasource = new MatTableDataSource<PdElementMapping[]>;
    this.selectAll = false
  }

  setTableData() {
    if (this.drawerMode == DrawerMode.MAPPING) {
      this.datasource = new MatTableDataSource<AssetPdElementMapping[]>;
      this.tableHeaders = BPA_ASEET_DRAWER_HEADERS;
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
      this.datasource = new MatTableDataSource(this.filteredAssetPdElementMapping);
    }
    else if (this.drawerMode == DrawerMode.PD_MAPPING) {
      this.datasource = new MatTableDataSource(this.tempAssetPdElementList);
    }
  }

  onAddNew() {
    if (this.drawerMode == DrawerMode.PD_MAPPING) {
      const type = BPA_EXTERNAL_WINDOW.ASSET_ELEMENT_PD;
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
    this.apiHelperService.addNewPdElements(body)
      .subscribe({
        next: async (res) => {
          this.isSubmitLoading = false;
          this.selectedAsset = null;
          this.addPdElementsToMasterList(res, category, dataSubject)
          this.viewType = this.TABLE_VIEW;
          this.pdElementForm.reset()
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
    this.tempAssetPdElementList.push(pdElementMapping)
  }

  resetNewItemFields() {
    this.assetForm.reset()
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


  cancelAddNewItem() {
    this.showAddInput = false;
    this.resetNewItemFields();
    this.cdr.detectChanges();
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
    const assetMapping = this.assetPdElementsMappingList?.[index];
    if (assetMapping?.asset?.name) {
      return assetMapping.asset.name;
    }
    return 'Assets';
  }

  get isEditMode() {
    return this.bpaService.isEditMode
  }

  onPostMessage(res: any) {
    if (res.type == BPA_EXTERNAL_WINDOW.ASSET_ELEMENT_PD) {
      const pdElementMapping: PdElementMapping = res?.data ?? null;
      if (pdElementMapping) {
        let findInTemp = this.tempAssetPdElementList.find(pdEle => pdEle.pdElement?.id === pdElementMapping.pdElement?.id);
        if (!findInTemp) {
          this.tempAssetPdElementList.push(pdElementMapping);
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

