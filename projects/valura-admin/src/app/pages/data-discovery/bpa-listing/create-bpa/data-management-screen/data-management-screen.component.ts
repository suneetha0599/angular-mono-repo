import { Component, EventEmitter, Input, OnInit, Output, ViewChild, SimpleChanges, OnChanges, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AssetPdElementMapping, BpaAsset, BpaDataSubject, DataSubjectPdElemementMapping, PdElementMapping, Purpose, RecipientPdElementMapping, SourcetPdElementMapping } from '@admin-core/models/data-inventory/BPA';
import { BPA_ASEET_HEADERS, CreatItemType, DATA_ELEMENT_HEADERS, DATA_MANAGMENT_TABS, DataElementHeaderKey, RECEPIENT_NAME_LIST, SOURCE_TYPE } from '../../constants';
import { MatTabsModule } from '@angular/material/tabs';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components/popup-dialog/popup-dialog.component';
import { buildRecipientForm, buildSourceForm, displayStatusText, sensitivityColors, sensitivityTextColors } from '../../bpa-utils';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ItemSelectorComponent, SelectorConfig, SelectorItem } from '../../item-selector/item-selector.component';
import { CreateItemDialogComponent } from '../../create-item-dialog/create-item-dialog.component';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { CategoryService } from '@admin-core/services/category/category.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { Subscription } from 'rxjs';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
@Component({
  selector: 'app-data-management-screen',
  standalone: true,
  imports: [EllipsisTooltipDirective, CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatMenuModule, MatPaginatorModule, MatSortModule, MatTooltipModule, MatChipsModule,
    MatDialogModule, MatTabsModule, LoadingButtonComponent, MatSelectModule, FormsModule, MatCheckboxModule, MatInputModule, FormsModule, ReactiveFormsModule, NgStyle, ItemSelectorComponent, ItemNotFoundComponent
  ],
  templateUrl: './data-management-screen.component.html',
  styleUrls: ['./data-management-screen.component.scss']
})
export class DataManagementScreenComponent implements OnChanges, OnDestroy {
  @Input() selectedTab: string = DATA_MANAGMENT_TABS.DATA_ELEMENTS
  @Input() source!: FormGroup;
  @Input() dataElements!: FormGroup;
  @Input() assetPdElementsMapping!: FormArray;
  @Input() dataUpdated: string = '';
  @Input() purposeList: Purpose[] = []
  @Input() recipientsPdElementsMapping!: FormArray;


  @Output() openViewDrawer = new EventEmitter<any>();
  @Output() onDataSubjectTabChange = new EventEmitter<any>();
  @Output() onPdElementsDeleted = new EventEmitter<any>();
  @Output() onNewItemAdded = new EventEmitter<any>();


  dataElementSelectorConfig: SelectorConfig = {
    type: CreatItemType.DATA_ELEMENTS,
    placeholder: 'Add Data Elements',
    title: 'Select Data Elements'
  };

  assetSelectorConfig: SelectorConfig = {
    type: CreatItemType.ASSET,
    placeholder: 'Select Assets',
    title: 'Add Assets'
  };

  sourceSelectorConfig: SelectorConfig = {
    type: CreatItemType.SOURCE,
    placeholder: 'Select Sources',
    title: 'Add Sources'
  };

  availableDataElements: SelectorItem[] = [];
  availableAssets: SelectorItem[] = [];
  availableSources: SelectorItem[] = [];
  selectedDataSubjectMapping!: DataSubjectPdElemementMapping;
  bpaCategoriesList: any[] = [];
  availableRecipients: SelectorItem[] = [];
  showSearch: boolean = false;
  searchText: string = '';
  dataSource = new MatTableDataSource<any>();
  selectedCategory: string | null = null;
  selectedDataSubjectIndex: number = 0
  tableHeaders: any = [];
  displayedHeaders = [];
  DataElementHeaderKey = DataElementHeaderKey
  DATA_MANAGMENT_TABS = DATA_MANAGMENT_TABS
  SOURCE_TYPE = SOURCE_TYPE
  sourceColumns = ['sourceName', 'category', 'type', 'pdElements', 'actions'];
  recipientColumns = ['recipientName', 'category', 'purpose', 'count', 'pdElements', 'actions'];
  detailList: string[] = [];
  CreatItemType = CreatItemType;
  selectAllControl = new FormControl(false);
  isIndeterminate = false;
  isEditMode: boolean = false;
  bpaUpdateSubscription!: Subscription;
  isLoading: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private bpaService = inject(BpaService);
  private snackbarService = inject(SnackbarService);
  private createBpaService = inject(CreateBpaService);
  private categoryService = inject(CategoryService);

  constructor(private cdr: ChangeDetectorRef, private dialog: MatDialog, private fb: FormBuilder) {
    this.bpaUpdateSubscription = this.bpaService.updateEditMode$.subscribe(_isEditMode => {
      if (_isEditMode == this.isEditMode) {
        return
      }
      this.isEditMode = _isEditMode;
      this.setControlDisable()
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.selectedCategory = null;
    this.cdr.detectChanges();
  }


  async ngOnInit() {
    this.initializeAvailableDataElements();
    this.initializeAvailableSources();
    this.initializeAvailableAssets();
    await this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataUpdated']) {
      if (this.dataUpdated) {
        this.prepareTableData();
      }
    }
    if (changes['selectedTab']) {
      this.updateSelectedDataSubjectMapping();
    }
  }

  ngOnDestroy(): void {
    this.bpaUpdateSubscription?.unsubscribe();
  }

  async loadCategories() {
    this.isLoading = true;
    try {
      this.bpaCategoriesList = await this.categoryService.getPdCategoryMasterList();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    finally {
      this.isLoading = false;
    }
  }

  getCategoryName(type: string): string {
    const category = RECEPIENT_NAME_LIST.find(r => r.key === type);
    return category?.name || type;
  }

  handleRecipientSelectorData(event: { pdElemementMappingList: any[] }) {
    if (!event.pdElemementMappingList || event.pdElemementMappingList.length === 0) {
      this.snackbarService.openSnack('Please select at least one recipient');
      return;
    }
    this.onNewItemAdded.emit({ recepientPdElementsMappingList: event.pdElemementMappingList, type: CreatItemType.RECEPIENT });
  }

  onCreateNewRecipient(event: any) {
    this.onNewItemAdded.emit({ recepientPdElementsMappingList: [event.newItem], type: CreatItemType.RECEPIENT });
  }

  getPurposeNames(purposes: any[]): string {
    if (!purposes || purposes.length === 0) {
      return '-';
    }

    if (purposes.length === 1) {
      return purposes[0].purposeName || '-';
    }

    return `${purposes[0].purposeName} (+${purposes.length - 1})`;
  }

  getSelectedPdCategory(category: any[]): string {
    if (!category || category.length === 0) {
      return '-';
    }

    if (category.length === 1) {
      return category[0] || '-';
    }

    return `${category[0]} (+${category.length - 1})`;
  }

  getSelectedPdClassification(classification: any[]): string {
    if (!classification || classification.length === 0) {
      return '-';
    }

    if (classification.length === 1) {
      return classification[0] || '-';
    }

    return `${classification[0]} (+${classification.length - 1})`;
  }



  private initializeAvailableDataElements() {
    this.availableDataElements = [];
  }

  private updateSelectedDataSubjectMapping() {
    if (this.selectedTab === DATA_MANAGMENT_TABS.DATA_ELEMENTS && this.dataSubjectsControls.length > 0) {
      this.selectedDataSubjectMapping = this.dataSubjectsControls[this.selectedDataSubjectIndex]?.value;
    }
  }

  onDataElementsSelected(selectedItems: any[]) {
    if (!selectedItems || selectedItems.length === 0) {
      this.snackbarService.openSnack('Please select at least one data element');
      return;
    }
    if (this.dataSubjectsControls.length === 0) {
      this.snackbarService.openSnack('Please add data subjects first');
      return;
    }
    this.onNewItemAdded.emit({ pdElementsMappingList: selectedItems, type: CreatItemType.DATA_ELEMENTS });
  }

  handleSourceSelectorData(event: { pdElemementMappingList: any[] }) {
    if (!event.pdElemementMappingList || event.pdElemementMappingList.length === 0) {
      this.snackbarService.openSnack('Please select at least one source');
      return;
    }
    this.onNewItemAdded.emit({ sourcePdElementsMappingList: event.pdElemementMappingList, type: CreatItemType.SOURCE });
  }

  private initializeAvailableSources() {
    this.availableSources = [];
  }

  private initializeAvailableAssets() {
    this.availableAssets = [];
  }

  handleAssetSelectorData(event: { pdElemementMappingList: any[] }) {
    if (!event.pdElemementMappingList || event.pdElemementMappingList.length === 0) {
      this.snackbarService.openSnack('Please select at least one asset');
      return;
    }
    this.onNewItemAdded.emit({ assetPdElementsMappingList: event.pdElemementMappingList, type: CreatItemType.ASSET });
  }

  onCreateNewAsset(event: any) {
    this.onNewItemAdded.emit({ assetPdElementsMappingList: [event.newItem], type: CreatItemType.ASSET });
  }

  onCreateNewSource(event: any) {
    this.onNewItemAdded.emit({ sourcePdElementsMappingList: [event.newItem], type: CreatItemType.SOURCE });
  }


  handleItemSelectorData(event: { pdElemementMappingList: any[] }) {
    if (!event.pdElemementMappingList || event.pdElemementMappingList.length === 0) {
      this.snackbarService.openSnack('Please select at least one data element');
      return;
    }
    const currentDataSubject = this.dataSubjectPdElementMapping.at(this.selectedDataSubjectIndex) as FormGroup;
    if (!currentDataSubject.value) {
      this.snackbarService.openSnack('Please select a data subject tab first');
      return;
    }
    this.onNewItemAdded.emit({ pdElementsMappingList: event.pdElemementMappingList, type: CreatItemType.DATA_ELEMENTS });
  }

  onCreateNewDataElement(event: any) {
    this.onNewItemAdded.emit({ pdElementsMappingList: [event.newItem], type: CreatItemType.DATA_ELEMENTS });
  }


  // mapToTableData(pdElementsMappingList: PdElementMapping[]): any[] {
  //   return pdElementsMappingList.map(item => ({
  //     personalDataElement: item.pdElement?.name ?? '',
  //     sensitivity: item.pdElement?.sensitivity ?? '',
  //     purpose: item.purpose && typeof (item.purpose as any) === 'object' && 'purposeName' in (item.purpose as any)
  //       ? (item.purpose as any).purposeName
  //       : (item.purpose ?? ''),
  //   }));
  // }

  prepareTableData() {

    switch (this.selectedTab) {
      case DATA_MANAGMENT_TABS.DATA_ELEMENTS:
        this.tableHeaders = DATA_ELEMENT_HEADERS;
        this.displayedHeaders = this.tableHeaders.map((h: any) => h.key);
        this.prepareDataElementDataSource();
        this.setControlDisable()
        break;
      case DATA_MANAGMENT_TABS.SOURCES:
        this.prepareSourcesDataSource();
        break;
      case DATA_MANAGMENT_TABS.ASSETS:
        this.tableHeaders = BPA_ASEET_HEADERS;
        this.displayedHeaders = this.tableHeaders.map((h: any) => h.key);
        this.prepareAssetDataSource();
        break;
      case DATA_MANAGMENT_TABS.RECIPIENTS:
        this.prepareDataSourceForRecipients();
        break;
      default:
        this.dataSource.data = [];
    }
  }

  prepareDataElementDataSource() {
    const currentFilter = this.dataSource?.filter || '';
    const formItems = this.pdElementsMappingControls as any[];
    this.dataSource = new MatTableDataSource(formItems);
    this.setupDataSource();
    if (currentFilter) {
      this.dataSource.filter = currentFilter;
    }
  }

  prepareSourcesDataSource() {
    const currentFilter = this.dataSource?.filter || '';
    const formSources = this.sourcePdElementsMappingControls as any[];

    this.dataSource = new MatTableDataSource(formSources);
    this.setupDataSource();
    if (currentFilter) {
      this.dataSource.filter = currentFilter;
    }
  }

  prepareAssetDataSource() {
    const currentFilter = this.dataSource?.filter || '';
    const formAssets = this.assetPdElementsMappingControls as any[];

    this.dataSource = new MatTableDataSource(formAssets);
    this.setupDataSource();
    if (currentFilter) {
      this.dataSource.filter = currentFilter;
    }
  }

  prepareDataSourceForRecipients() {
    const currentFilter = this.dataSource?.filter || '';
    const formRecipients = this.recipientsPdElementsMappingControls as any[];

    this.dataSource = new MatTableDataSource(formRecipients);
    this.setupDataSource();
    //  this.cdr.detectChanges();
    if (currentFilter) {
      this.dataSource.filter = currentFilter;
    }
  }


  onSourceTypeChange(element: any, newType: string) {
    element.sourceType = newType;
  }

  getTitle(): string {
    switch (this.selectedTab) {
      case DATA_MANAGMENT_TABS.DATA_ELEMENTS:
        return 'What is the data we\'re collecting';
      case DATA_MANAGMENT_TABS.SOURCES:
        return 'Specify how are we collecting the personal data.';
      case DATA_MANAGMENT_TABS.ASSETS:
        return 'Specify the assets used for processing the personal data.';
      case DATA_MANAGMENT_TABS.RECIPIENTS:
        return 'Specify who have access to the personal data';
      default:
        return '';
    }
  }

  getAddButtonText(): string {
    switch (this.selectedTab) {
      case DATA_MANAGMENT_TABS.DATA_ELEMENTS:
        return 'Add Data Elements';
      case DATA_MANAGMENT_TABS.SOURCES:
        return 'Add Sources';
      case DATA_MANAGMENT_TABS.ASSETS:
        return 'Add Assets';
      case DATA_MANAGMENT_TABS.RECIPIENTS:
        return 'Add Recipients';
      default:
        return 'Add';
    }
  }

  filterByCategory(category: string) {

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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onAddClick() {
    if (this.selectedTab === DATA_MANAGMENT_TABS.DATA_ELEMENTS) {
      const ds = this.dataSubjectPdElementMapping.at(this.selectedDataSubjectIndex) as FormGroup;
      const dataSubject = ds?.value;
      if (!dataSubject) {
        this.snackbarService.openSnack("Please select at least one data subject!");
        return;
      }
      this.onDataSubjectTabChange.emit({ dataSubject: dataSubject, index: this.selectedDataSubjectIndex });
      return;
    }
  }

  onViewSource(source: SourcetPdElementMapping) {
    this.openViewDrawer.emit({
      mode: 'view',
      sourceData: source
    });
  }

  formatEnum(value: string) {
    return value
      ?.toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  onDeleteItems(element: FormGroup, index: number) {
    let sourceName = '';
    let _mappingObj = null
    if (this.selectedTab === DATA_MANAGMENT_TABS.DATA_ELEMENTS) {
      const mapping = element.value as PdElementMapping;
      if (!mapping || !mapping?.pdElement) {
        console.error('Invalid data:', element);
        return;
      }
      sourceName = mapping.pdElement.name || 'Unknown';
      _mappingObj = mapping
    }
    else if (this.selectedTab === DATA_MANAGMENT_TABS.SOURCES) {
      const mapping = element.value as SourcetPdElementMapping;
      if (!mapping || !mapping?.source) {
        console.error('Invalid data:', element);
        return;
      }
      sourceName = mapping.source.name || 'Unknown';
      _mappingObj = mapping
    }
    else if (this.selectedTab === DATA_MANAGMENT_TABS.ASSETS) {
      const mapping = element.value as AssetPdElementMapping;
      if (!mapping || !mapping?.asset) {
        console.error('Invalid data:', element);
        return;
      }
      sourceName = mapping.asset.name || 'Unknown';
      _mappingObj = mapping
    }
    else if (this.selectedTab === DATA_MANAGMENT_TABS.RECIPIENTS) {
      const mapping = element.value as RecipientPdElementMapping;
      if (!mapping || !mapping?.recipient) {
        console.error('Invalid data:', element);
        return;
      }
      sourceName = mapping.recipient.name || 'Unknown';
      _mappingObj = mapping
    }
    this.openConfirmationDialog(sourceName, index, _mappingObj)
  }

  openConfirmationDialog(itemName: string, index: number, _mappingObj: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: `Are you sure you want to delete the source "${itemName}"? This action cannot be undone.`,
        confirmationDetail: itemName,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning'
      } as PopupDialogData
    });


    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deleteRow(index, _mappingObj);
      }
    });
  }

  showPdElementsPopup(source: FormGroup, index: number) {
    this.openViewDrawer.emit({
      mode: 'editPdElements',
      sourceData: source.value,
      selectedSourceIndex: index
    });
  }

  deleteRow(index: number, _mappingObj: any) {
    if (this.selectedTab === DATA_MANAGMENT_TABS.DATA_ELEMENTS) {
      this.pdElementsMapping.removeAt(index);
      const dataSubject: any = this.selectedDataSubjectMapping.dataSubjectType;
      this.createBpaService.onDeletePdElement(dataSubject, _mappingObj);
      this.prepareDataElementDataSource();
      this.onPdElementsDeleted.emit({ deletedItems: _mappingObj })
    }
    else if (this.selectedTab === DATA_MANAGMENT_TABS.SOURCES) {
      this.sourcePdElementsMapping.removeAt(index);
      this.createBpaService.onDeleteSource(_mappingObj);
      this.prepareSourcesDataSource();
    }
    else if (this.selectedTab === DATA_MANAGMENT_TABS.ASSETS) {
      this.assetPdElementsMapping.removeAt(index);
      this.createBpaService.onDeleteAsset(_mappingObj);
      this.prepareAssetDataSource();
    }
    else if (this.selectedTab === DATA_MANAGMENT_TABS.RECIPIENTS) {
      this.recipientsPdElementsMapping.removeAt(index);
      this.createBpaService.onDeleteRecepient(_mappingObj);
      this.prepareDataSourceForRecipients();
    }
  }

  onDsTabChange(index: number) {
    this.selectedDataSubjectIndex = index;
    const ds = this.dataSubjectPdElementMapping.at(this.selectedDataSubjectIndex) as FormGroup;
    const dataSubject = ds?.value;
    this.onDataSubjectTabChange.emit({ dataSubject: dataSubject, index: this.selectedDataSubjectIndex });
    this.selectedDataSubjectMapping = dataSubject;
    this.resetSelectionForCurrentTab();

    if (this.selectedTab === DATA_MANAGMENT_TABS.DATA_ELEMENTS) {
      this.prepareDataElementDataSource();
    }
  }

  resetSelectionForCurrentTab() {
    const items = this.pdElementsMapping?.controls ?? [];
    const selectedCount = items.filter(
      (ctrl: any) => ctrl.get('selected')?.value === true
    ).length;

    this.selectAllControl.setValue(selectedCount === items.length && items.length > 0);
    this.isIndeterminate = selectedCount > 0 && selectedCount < items.length;
    this.dataElements.get('showPurposeSection')?.setValue(selectedCount >= 1);
    if (selectedCount > 0) {
      this.dataElements.get('selectedPurpose')?.enable();
    } else {
      this.dataElements.get('selectedPurpose')?.disable();
    }
  }

  get dataSubjectPdElementMapping(): FormArray {
    return this.dataElements?.get('dataSubjectPdElementMapping') as FormArray;
  }

  get selectedPurpose(): FormControl {
    return this.dataElements?.get('selectedPurpose') as FormControl;
  }

  get dataSubjectsControls() {
    return this.dataSubjectPdElementMapping?.controls ?? [];
  }

  get pdElementsMapping(): FormArray {
    if (this.dataSubjectPdElementMapping && this.dataSubjectPdElementMapping.length > this.selectedDataSubjectIndex) {
      const dataSubject = this.dataSubjectPdElementMapping.at(this.selectedDataSubjectIndex) as FormGroup;
      return dataSubject?.get('pdElementMappingList') as FormArray;
    }
    return new FormArray<any>([]);
  }

  get pdElementsMappingControls() {
    return this.pdElementsMapping?.controls ?? [];
  }

  get assetPdElementsMappingControls() {
    return this.assetPdElementsMapping?.controls ?? [];
  }

  get sourcePdElementsMapping(): FormArray {
    return this.source?.get('sourcePdElementsMapping') as FormArray;
  }

  get sourcePdElementsMappingControls() {
    return this.sourcePdElementsMapping?.controls ?? [];
  }

  get recipientsPdElementsMappingControls() {
    return this.recipientsPdElementsMapping?.controls ?? [];
  }

  onBulkSave() {
    for (const pdElementMapping of this.pdElementsMapping?.controls) {
      const fromGroup = pdElementMapping as FormGroup;
      const selected = fromGroup?.get('selected') as FormControl;
      const pdPurposes = Array.isArray(fromGroup.value.purpose) ? fromGroup.value.purpose ?? [] : [];
      const pdPurposeIds = new Set((pdPurposes).map((_purpose: any) => _purpose.id));
      const selectedPurpose = this.selectedPurpose.value;
      const newPdPurposes = [
        ...pdPurposes,
        ...selectedPurpose.filter((_purpose: any) => !pdPurposeIds.has(_purpose.id))
      ];
      if (selected?.value) {
        fromGroup.patchValue({
          purpose: newPdPurposes
        });
      }
    }
    this.selectedPurpose.reset()
    for (const pdElementMapping of this.pdElementsMapping?.controls) {
      const formGroup = pdElementMapping as FormGroup;
      formGroup.get('selected')?.setValue(false, { emitEvent: false });
    }

    this.selectAllControl.setValue(false, { emitEvent: false });
    this.isIndeterminate = false;
    this.selectedPurpose.reset()
    this.dataElements.get('showPurposeSection')?.setValue(false);
  }



  onCancel() {
    this.selectedPurpose.reset();
    for (const pdElementMapping of this.pdElementsMapping?.controls) {
      const formGroup = pdElementMapping as FormGroup;
      formGroup.get('selected')?.setValue(false, { emitEvent: false });
    }
    this.selectAllControl.setValue(false, { emitEvent: false });
    this.isIndeterminate = false;
    this.dataElements.get('showPurposeSection')?.setValue(false);
  }


  onChangeSelectAll(event: MatCheckboxChange) {
    const checked = event.checked;
    for (const pdElementMapping of this.pdElementsMapping?.controls) {
      const fromGroup = pdElementMapping as FormGroup;
      fromGroup?.get('selected')?.setValue(checked);
    }


    if (checked) {
      this.dataElements?.get('selectedPurpose')?.enable();
      this.dataElements?.get('showPurposeSection')?.setValue(true);
    } else {
      this.dataElements?.get('selectedPurpose')?.disable();
      this.dataElements?.get('showPurposeSection')?.setValue(false);
    }


    this.isIndeterminate = false;
  }


  onChangeEvent(event: MatCheckboxChange) {
    const checked = event.checked;


    const selectedCount = this.pdElementsMapping?.controls.filter(
      (ctrl: any) => ctrl.get('selected')?.value === true
    ).length || 0;


    this.updateSelectAllState();


    this.dataElements?.get('showPurposeSection')?.setValue(selectedCount >= 2);


    if (selectedCount > 0) {
      this.dataElements?.get('selectedPurpose')?.enable();
    } else {
      this.dataElements?.get('selectedPurpose')?.disable();
    }
  }


  private updateSelectAllState() {
    const selectedCount = this.pdElementsMapping?.controls.filter(
      (ctrl: any) => ctrl.get('selected')?.value === true
    ).length || 0;

    const totalCount = this.pdElementsMapping?.controls.length || 0;

    if (selectedCount === 0) {
      this.selectAllControl.setValue(false, { emitEvent: false });
      this.isIndeterminate = false;
    } else if (selectedCount === totalCount) {
      this.selectAllControl.setValue(true, { emitEvent: false });
      this.isIndeterminate = false;
    } else {
      this.selectAllControl.setValue(false, { emitEvent: false });
      this.isIndeterminate = true;
    }
  }


  getHostingLocation(asset: BpaAsset) {
    return `${asset.hostingSite?.length ? `${typeof asset.hostingSite?.[0] == 'string' ? asset.hostingSite?.[0] : asset.hostingSite?.[0]?.hostingSite ?? ''} ${asset.hostingSite.length > 1 ? `(+${asset.hostingSite.length - 1})` : ``}` : ``}`;
  }

  getDataSubjectName(dataSubject: BpaDataSubject[]) {
    return `${dataSubject?.length ? `${dataSubject?.[0]?.name} ${dataSubject.length > 1 ? `(+${dataSubject.length - 1})` : ``}` : `-`}`;
  }

  openPdElementMapping(index: number) {
    if (this.selectedTab === DATA_MANAGMENT_TABS.SOURCES) {
      this.openViewDrawer.emit({
        mode: 'editPdElements',
        selectedSourceIndex: index
      });
      return;
    }
    if (this.selectedTab === DATA_MANAGMENT_TABS.ASSETS) {
      this.openViewDrawer.emit({
        mode: 'editPdElements',
        selectedAssetIndex: index
      });
      return;
    }
    if (this.selectedTab === DATA_MANAGMENT_TABS.RECIPIENTS) {
      this.openViewDrawer.emit({
        mode: 'editPdElements',
        selectedRecepientIndex: index
      });
      return;
    }
  }

  msComparePurpose(objOne: Purpose, objTwo: Purpose) {
    return objOne.id === objTwo.id;
  }

  getSelectedPdCount(row: any) {
    return row.pdElementMappingList?.filter((pd: any) => pd.selected).length || 0;
  }

  showDataSubjectDetail(dataSubject: BpaDataSubject[]) {
    this.detailList = [];
    if (this.showDetail(dataSubject)) {
      this.detailList = dataSubject.map(ds => ds.name);
      return;
    }
  }

  showDetail(detailList: any[]) {
    return detailList?.length > 1 ? true : false;
  }

  showHostingLocationDetail(hostingSiteList: any[]) {
    this.detailList = [];
    if (this.showDetail(hostingSiteList)) {
      this.detailList = (hostingSiteList ?? []).map(hs => typeof hs == 'string' ? hs : (hs?.hostingSite ?? ''));
      return;
    }
  }


  onEditDataElement(element: FormGroup, index: number) {
    const dataElementData = element.value;
    const pdElement = dataElementData.pdElement;
    const dialogRef = this.dialog.open(CreateItemDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: CreatItemType.DATA_ELEMENTS,
        editData: {
          id: pdElement?.id,
          name: pdElement?.name,
          categoryId: pdElement?.categoryIds || [],
          classificationId: pdElement?.classificationId || [],
          purpose: dataElementData.purpose || [],
          originalCategoryMappings: pdElement.categoryMapping,
          originalClassificationMappings: pdElement.classificationMapping,
          originalPurposeMappings: dataElementData.purpose || [],
        },
        purposeList: this.purposeList
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.item) {
        const pdElementControl = element.get('pdElement') as FormGroup;
        const purposeControl = element.get('purpose') as FormControl;
        const categories = Array.isArray(result.item.categoryName) ? result.item.categoryName : [];
        const classifications = Array.isArray(result.item.classificationName) ? result.item.classificationName : [];
        pdElementControl.patchValue({
          ...pdElement,
          ...result.item,
          name: result.item.name,
          categoryId: result.item.categoryId,
          categoryIds: result.item.categoryId,
          classificationId: result.item.classificationId,
          categoryName: categories.length > 0 ? categories[0] : '',
          categoryNames: categories,
          classification: classifications,
          classificationName: classifications.length > 0 ? classifications[0] : '',
        });

        if (purposeControl) {
          purposeControl.setValue(result.item.purpose || []);
        }
        this.prepareDataElementDataSource();
        this.cdr.detectChanges();
      }
    });
  }

  onEditSource(element: FormGroup, index: number) {
    const sourceData = { ...element.value.source, type: element.value.type };

    const dialogRef = this.dialog.open(CreateItemDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: CreatItemType.SOURCE,
        editData: sourceData
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.item) {
        const updatedSource = {
          ...element.value,
          source: {
            ...element.value.source,
            ...result.item
          },
          type: result.item?.type ?? ''
        };
        const formGroup = buildSourceForm(this.fb, updatedSource);
        this.sourcePdElementsMapping.setControl(index, formGroup);
        this.prepareSourcesDataSource();
      }
    });
  }

  onEditAsset(element: FormGroup, index: number) {
    const assetData = element.value.asset;

    const dialogRef = this.dialog.open(CreateItemDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: CreatItemType.ASSET,
        editData: assetData
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.item) {
        const assetControl = element.get('asset') as FormGroup;
        if (assetControl) {
          assetControl.patchValue({
            ...result.item,
            name: result.item.name,
            type: result.item.type,
            category: result.item.category || assetData.category,
            categoryName: result.item.categoryName || assetData.categoryName
          });
        }
        this.prepareAssetDataSource();
      }
    });
  }

  onEditRecipient(element: FormGroup, index: number) {
    const recipientData = element.value;

    const dialogRef = this.dialog.open(CreateItemDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: CreatItemType.RECEPIENT,
        editData: {
          id: recipientData.recipient?.id,
          name: recipientData.recipient?.name,
          category: recipientData.type,
          purpose: recipientData.purpose,
          count: recipientData.numberOfPersonHavingAccess
        }
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.item) {

        const updatedRecepient = {
          ...element.value,
          recipient: {
            ...element.value.recipient,
            name: result.item.name
          },
          type: result.item.category,
          purpose: result.item.purpose,
          numberOfPersonHavingAccess: result.item.count
        };
        const formGroup = buildRecipientForm(this.fb, updatedRecepient);
        this.recipientsPdElementsMapping.setControl(index, formGroup);
        this.dataSource.data = [...this.recipientsPdElementsMappingControls];
        this.cdr.detectChanges();
      }
    });
  }


  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    this.searchText = '';
    if (!this.showSearch) {
      this.applySearchFilter();
    }
  }

  onSearchChange() {
    this.searchText = this.searchText.trimStart();
    this.applySearchFilter();
  }

  clearSearch() {
    this.searchText = '';
    this.applySearchFilter();
  }

  private applySearchFilter() {
    if (this.searchText) {
      const filterValue = this.searchText.trim().toLowerCase();
      this.dataSource.filter = filterValue;
    } else {
      this.dataSource.filter = '';
    }
  }

  private setupDataSource() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;


    this.dataSource.filterPredicate = this.getFilterPredicate();


    if (this.searchText && this.searchText.trim()) {
      this.dataSource.filter = this.searchText.trim().toLowerCase();
    }
  }


  showPurposeDetails(purposes: any[]) {
    this.detailList = [];
    if (this.showDetail(purposes)) {
      this.detailList = (purposes ?? []).map(p => p.purposeName || p.name || '');
    }
  }


  showCategoryDetails(categories: string[]) {
    this.detailList = [];
    if (this.showDetail(categories)) {
      this.detailList = categories ?? [];
    }
  }

  showClassificationDetails(classifications: string[]) {
    this.detailList = [];
    if (this.showDetail(classifications)) {
      this.detailList = classifications ?? [];
    }
  }



  private getFilterPredicate() {
    return (data: any, filter: string) => {
      if (!filter) return true;

      const searchStr = filter.toLowerCase();

      switch (this.selectedTab) {
        case DATA_MANAGMENT_TABS.DATA_ELEMENTS:
          const pdElement = data.get('pdElement')?.value;
          return (
            pdElement?.name?.toLowerCase().includes(searchStr) ||
            pdElement?.categoryName?.toLowerCase().includes(searchStr) ||
            this.getSensitivityText(pdElement?.sensitivity)?.toLowerCase().includes(searchStr) ||
            this.getPurposeNames(data.get('purpose')?.value)?.toLowerCase().includes(searchStr)
          );

        case DATA_MANAGMENT_TABS.ASSETS:
          const asset = data.get('asset')?.value;
          return (
            asset?.name?.toLowerCase().includes(searchStr) ||
            asset?.type?.toLowerCase().includes(searchStr) ||
            asset?.categoryName?.toLowerCase().includes(searchStr)
          );

        case DATA_MANAGMENT_TABS.SOURCES:
          const source = data.get('source')?.value;
          return (
            source?.name?.toLowerCase().includes(searchStr) ||
            source?.category?.toLowerCase().includes(searchStr) ||
            source?.type?.toLowerCase().includes(searchStr)
          );

        case DATA_MANAGMENT_TABS.RECIPIENTS:
          const recipient = data.get(CreatItemType.RECEPIENT)?.value;
          return (
            recipient?.name?.toLowerCase().includes(searchStr) ||
            data.get('type')?.value?.toLowerCase().includes(searchStr) ||
            data.get('purpose')?.value?.toLowerCase().includes(searchStr) ||
            data.get('numberOfPersonHavingAccess')?.value?.toString().includes(searchStr)
          );

        default:
          return JSON.stringify(data).toLowerCase().includes(searchStr);
      }
    };
  }

  get dataSubjectsControlsSize() {
    return (this.dataSubjectsControls?.length ?? 0)
  }

  get showPurposeSelection() {
    return this.dataElements.get('showPurposeSection')?.value;
  }

  setControlDisable() {
    if (!this.isEditMode) {
      this.selectAllControl.disable();
    }
    else {
      this.selectAllControl.enable();
    }
  }

  disablePdMappingButton(element: FormGroup) {
    return element?.get('pdElementMappingList')?.value?.length ? false : !this.isEditMode
  }

  get sourcePdElementsMappingList() {
    return this.sourcePdElementsMapping?.value ?? [];
  }

  get recipientsPdElementsMappingList() {
    return this.recipientsPdElementsMapping?.value ?? [];
  }

  get assetPdElementsMappingList() {
    return this.assetPdElementsMapping?.value ?? [];
  }

  get isSearchEmpty(): boolean {
    return this.dataSource?.filteredData?.length === 0;
  }
}
