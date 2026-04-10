import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatButtonModule, } from '@angular/material/button';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatInputModule, } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { CreateBpaTabKey, BpaDrawerViewType, DATA_ELEMENT_DRAWER_HEADERS, DataElementHeaderKey, BPA_EXTERNAL_WINDOW, DrawerMode, CreatItemType } from '../constants';
import { PdElementMapping, PdElement, DataSubjectPdElemementMapping, BpaCategory, SourcetPdElementMapping, AssetPdElementMapping, RecipientPdElementMapping, Purpose } from '@admin-core/models/data-inventory/BPA';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { displayStatusText, sensitivityColors, sensitivityTextColors } from '../bpa-utils';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { MatTabsModule } from '@angular/material/tabs';
import { ItemSelectorComponent, SelectorItem } from '../item-selector/item-selector.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateItemDialogComponent } from '../create-item-dialog/create-item-dialog.component';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { MatMenuModule } from "@angular/material/menu";

@Component({
  selector: 'bpa-drawer-data-elements',
  imports: [MatCheckbox, MatFormFieldModule, MatInputModule, LoadingButtonComponent, ItemSelectorComponent,
    FormsModule, MatSortModule, MatTableModule, NgTemplateOutlet, MatButtonModule, ReactiveFormsModule, MatTabsModule, MatIcon, MatMenuModule],
  templateUrl: './bpa-drawer-data-elements.component.html',
  styleUrl: './bpa-drawer-data-elements.component.scss'
})
export class BpaDrawerDataElementsComponent {
  @Input() drawerType: string = CreateBpaTabKey.SOURCES;
  @Input() selectedIndex: number = -1;
  @Input() dataSubjectPdElementMapping: DataSubjectPdElemementMapping[] = [];
  @Input() sourceMappingList: SourcetPdElementMapping[] = [];
  @Input() assetMappingList: AssetPdElementMapping[] = [];
  @Input() recipientsMappingList: RecipientPdElementMapping[] = [];
  @Input() purposeList: Purpose[] = []

  @Output() onCloseDrawer = new EventEmitter<any>()
  @Output() onApplyChanges = new EventEmitter<any>()
  @Output() onUpdatePdElements = new EventEmitter<any>()
  @Output() onNewItemAdded = new EventEmitter<any>();

  searchValue: string = ''
  CreateBpaTabKey = CreateBpaTabKey;
  BpaDrawerViewType = BpaDrawerViewType
  selectedCategory: number[] = []
  tempSelectedCategory: number[] = []
  selectedPdElements!: PdElement
  tempPdElemementMappingList: PdElementMapping[] = [];
  filteredPdElemementMappingList: PdElementMapping[] = [];
  totalSelected: number = 0
  bpaCategoriesList: BpaCategory[] = []
  isLoading: boolean = false;
  tableHeaders: any = [];
  displayedHeaders = [];
  DataElementHeaderKey = DataElementHeaderKey
  selectAll: boolean = false;
  showSearch: boolean = false;
  searchText: string = '';
  TABLE_VIEW = 'TABLE_VIEW'
  ADD_VIEW = 'ADD_VIEW'
  viewType: string = this.TABLE_VIEW
  pdElementForm!: FormGroup
  isSubmitLoading: boolean = false;
  tempDataSubjectPdElementMapping: DataSubjectPdElemementMapping[] = [];
  drawerTitle: string = ''
  DrawerMode = DrawerMode;
  selectedDataSubjectIndex: number = 0
  selectedDataSubjectMapping!: DataSubjectPdElemementMapping;
  dataSource = new MatTableDataSource<any>();
  CreatItemType = CreatItemType;
  deletedPdElementMappingList: PdElementMapping[] = [];
  detailList: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private configApiHelperService = inject(ConfigApiHelperService);
  private snackbarService = inject(SnackbarService);
  private createBpaService = inject(CreateBpaService);
  private bpaService = inject(BpaService);

  constructor(private fb: FormBuilder, private dialog: MatDialog) {
    this.pdElementForm = this.fb.group({
      pdElementName: ['', Validators.required],
      pdElementCategory: [null, Validators.required],
    })
  }


  ngOnInit() {
    this.clearData()
    this.setTableData()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedIndex'] && this.selectedIndex > -1) {
      this.onInitDrawer()
    }
  }

  get sourceMapping(): SourcetPdElementMapping {
    return (this.sourceMappingList?.[this.selectedIndex])
  }

  get assetMapping(): AssetPdElementMapping {
    return (this.assetMappingList?.[this.selectedIndex])
  }

  get recipientsMapping(): RecipientPdElementMapping {
    return (this.recipientsMappingList?.[this.selectedIndex])
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

  async getPdElements(categoryIds: number[]) {
    const params = {
      categoryIds: categoryIds
    }
    const data = await this.configApiHelperService.getPDElements(params);
    return data?.pdElements ? data.pdElements : [];
  }

  // calculatePdEleTotalValues() {
  //   let totalCount = 0;
  //   for (const pdElemementMapping of this.tempPdElemementMappingList) {
  //     if (pdElemementMapping.selected) {
  //       totalCount += 1;
  //     }
  //   }
  //   this.totalSelected = +(totalCount ?? 0)
  // }




  showDetail(list: any[]): boolean {
    return list && list.length > 1;
  }

  showDetailList(list: string[]) {
    this.detailList = list || [];
  }

  showPurposeDetails(purposes: any[]) {
    this.detailList = (purposes || []).map(p => p.purposeName || p.name || '-');
  }

  getSelectedPdCategory(categories: string[]): string {
    if (!categories || categories.length === 0) return '-';
    return categories.length === 1 ? categories[0] : `${categories[0]} (+${categories.length - 1})`;
  }

  getSelectedPdClassification(classifications: string[]): string {
    if (!classifications || classifications.length === 0) return '-';
    if (Array.isArray(classifications)) {
      return classifications.length === 1 ? classifications[0] : `${classifications[0]} (+${classifications.length - 1})`;
    }
    return classifications;
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

  onChangeEvent(event: MatCheckboxChange, pdElementMapping: PdElementMapping, dataSubjectMapping: DataSubjectPdElemementMapping) {
    const checked = event.checked;
    pdElementMapping.selected = checked;


    this.updateDataSubjectSelectionState(dataSubjectMapping);


    this.onDeletePdElements(checked, pdElementMapping);
  }

  private updateDataSubjectSelectionState(dataSubjectMapping: DataSubjectPdElemementMapping) {
    if (!dataSubjectMapping?.pdElementMappingList?.length) {
      dataSubjectMapping.selected = false;
      return;
    }

    const selectedCount = this.getSelectedCount(dataSubjectMapping);
    const totalCount = dataSubjectMapping.pdElementMappingList.length;

    dataSubjectMapping.selected = selectedCount === totalCount;
  }

  onChangeSelectAll(event: MatCheckboxChange, dataSubjectMapping: DataSubjectPdElemementMapping) {
    const checked = event.checked;


    dataSubjectMapping.pdElementMappingList.forEach(pdElementMapping => {
      pdElementMapping.selected = checked;
      this.onDeletePdElements(checked, pdElementMapping);
    });


    dataSubjectMapping.selected = checked;
  }

  onDeletePdElements(checked: boolean, pdElementMapping: PdElementMapping) {
    if (!pdElementMapping.pdElement?.pdBpaMappingId) {
      return
    }
    let pdElementMappingList: PdElementMapping[] = [];

    if (this.drawerType == CreateBpaTabKey.SOURCES) {
      const sourcePdElementMappingList = this.sourceMapping?.pdElementMappingList ?? [];
      pdElementMappingList = [...sourcePdElementMappingList];
    }
    else if (this.drawerType == CreateBpaTabKey.ASSETS) {
      const assetPdElementMappingList = this.assetMapping?.pdElementMappingList ?? [];
      pdElementMappingList = [...assetPdElementMappingList];
    }
    else if (this.drawerType == CreateBpaTabKey.RECIPIENTS) {
      const recipientsPdElementMappingList = this.recipientsMapping?.pdElementMappingList ?? [];
      pdElementMappingList = [...recipientsPdElementMappingList];
    }
    let findPdElements = pdElementMappingList?.length ? pdElementMappingList.find(pd => pd?.pdElement?.id == pdElementMapping?.pdElement?.id && (pd?.dataSubject?.id == pdElementMapping.dataSubject?.id)) : null;
    if (!findPdElements) {
      return
    }
    if (findPdElements.pdElement?.pdBpaMappingId) {
      if (checked) {
        let index = this.deletedPdElementMappingList.findIndex(_pdEle => findPdElements.pdElement?.pdBpaMappingId);
        this.deletedPdElementMappingList.splice(index, 1)
      }
      else {
        this.deletedPdElementMappingList.push(findPdElements)
      }
    }
  }

  searchPdElements() {
    this.filteredPdElemementMappingList = this.tempPdElemementMappingList.filter((item: PdElementMapping) => {
      return (item.pdElement?.name.trim().toLowerCase().includes(this.searchValue.trim().toLowerCase()))
    })
    if (!this.searchValue) {
      this.filteredPdElemementMappingList = [...this.tempPdElemementMappingList];
    }
  }

  onInitDrawer() {
    this.clearData();
    if (this.drawerType == CreateBpaTabKey.SOURCES) {
      this.drawerTitle = this.sourceMapping?.source?.name ?? ''
    }
    else if (this.drawerType == CreateBpaTabKey.ASSETS) {
      this.drawerTitle = this.sourceMapping?.source?.name ?? ''
    }
    else if (this.drawerType == CreateBpaTabKey.RECIPIENTS) {
      this.drawerTitle = this.sourceMapping?.source?.name ?? ''
    }
    this.mapDataSubjectMapping()
  }

  clearData() {
    this.tempPdElemementMappingList = [];
    this.filteredPdElemementMappingList = [];
    this.selectedCategory = [];
    this.deletedPdElementMappingList = []
    this.tempDataSubjectPdElementMapping = []
    this.selectAll = false

  }

  setTableData() {
    this.tableHeaders = DATA_ELEMENT_DRAWER_HEADERS;
    this.displayedHeaders = this.tableHeaders.map((c: any) => c.key);
    this.prepareDataSource();
  }

  mapDataSubjectMapping() {
    if (this.dataSubjectPdElementMapping?.length) {
      const tempDataSubjectPdElementMapping = JSON.stringify([...this.dataSubjectPdElementMapping]);
      this.tempDataSubjectPdElementMapping = JSON.parse(tempDataSubjectPdElementMapping);

      let pdElementMappingList: PdElementMapping[] = [];
      let updateMappingId: boolean = false;
      if (this.drawerType == CreateBpaTabKey.SOURCES) {
        const sourcePdElementMappingList = this.sourceMapping?.pdElementMappingList ?? [];
        pdElementMappingList = [...sourcePdElementMappingList];
        updateMappingId = true;
      }
      else if (this.drawerType == CreateBpaTabKey.ASSETS) {
        const assetPdElementMappingList = this.assetMapping?.pdElementMappingList ?? [];
        pdElementMappingList = [...assetPdElementMappingList];
        updateMappingId = true;
      }
      else if (this.drawerType == CreateBpaTabKey.RECIPIENTS) {
        const recipientsPdElementMappingList = this.recipientsMapping?.pdElementMappingList ?? [];
        pdElementMappingList = [...recipientsPdElementMappingList];
        updateMappingId = true;
      }
      else {
        this.tempDataSubjectPdElementMapping = []
      }

      for (const dataSubject of this.tempDataSubjectPdElementMapping) {
        for (const pdElement of dataSubject.pdElementMappingList) {
          pdElement.newAdded = false

          let find = pdElementMappingList?.length ? pdElementMappingList.find(pd => pd?.pdElement?.id == pdElement?.pdElement?.id && (pd?.dataSubject?.id == pdElement.dataSubject?.id)) : null;
          pdElement.selected = find ? true : false;
          if (pdElement.pdElement) {
            const referencePdElementMappingId = pdElement?.pdElement?.pdBpaMappingId ?? 0;
            if (updateMappingId) {
              pdElement.pdElement.pdBpaMappingId = find ? (find?.pdElement?.pdBpaMappingId ?? 0) : 0
            }
            pdElement.pdElement.originalPdBpaMapingId = referencePdElementMappingId;
          }
        }

        this.updateDataSubjectSelectionState(dataSubject);
      }
    }
    this.onDsTabChange(0);
  }


  onApplyClick() {
    this.isSubmitLoading = true;
    let pdElementMappingList: PdElementMapping[] = [];
    for (const dataSubject of this.tempDataSubjectPdElementMapping) {
      const dsPdElementMappingList = dataSubject.pdElementMappingList.filter(pdEle => pdEle.selected);
      pdElementMappingList = pdElementMappingList.concat(dsPdElementMappingList);
    }

    let dataSubjectMapping = [];
    let index = 0;
    for (const dataSubject of this.tempDataSubjectPdElementMapping) {
      const dsPdElementMappingList = dataSubject.pdElementMappingList.filter(pdEle => pdEle.newAdded);
      dataSubjectMapping.push({ index: index, pdElementMappingList: dsPdElementMappingList });
      index++;
    }
    let data = null;

    if (this.drawerType == CreateBpaTabKey.SOURCES) {
      data = {
        sourcePdElementList: pdElementMappingList,
        dsPdElementMappingList: dataSubjectMapping,
        drawerMode: DrawerMode.PD_MAPPING,
        deletedPdElementMappingList: this.deletedPdElementMappingList
      };
    }
    else if (this.drawerType == CreateBpaTabKey.ASSETS) {
      data = {
        assetPdElementList: pdElementMappingList,
        dsPdElementMappingList: dataSubjectMapping,
        drawerMode: DrawerMode.PD_MAPPING,
        deletedPdElementMappingList: this.deletedPdElementMappingList
      };
    }
    else if (this.drawerType == CreateBpaTabKey.RECIPIENTS) {
      data = {
        recepientPdElementList: pdElementMappingList,
        dsPdElementMappingList: dataSubjectMapping,
        drawerMode: DrawerMode.PD_MAPPING,
        deletedPdElementMappingList: this.deletedPdElementMappingList
      };
    }
    this.isSubmitLoading = false
    if (data) {
      this.onApplyChanges.emit(data);
    }
    this.clearData()
  }

  onDsTabChange(index: number) {
    this.selectedDataSubjectIndex = index;
    this.selectedDataSubjectMapping = this.tempDataSubjectPdElementMapping[this.selectedDataSubjectIndex];
    this.setTableData()
  }

  handleItemSelectorData(event: { pdElemementMappingList: any[] }) {

    if (!event.pdElemementMappingList || event.pdElemementMappingList.length === 0) {
      this.snackbarService.openSnack('Please select at least one data element');
      return;
    }

    if (!this.selectedDataSubjectMapping) {
      this.snackbarService.openSnack('Please select a data subject tab first');
      return;
    }
    event.pdElemementMappingList.forEach(item => {
      this.onAddNewPdElements(item)
    });
    this.onNewItemAdded.emit({ pdElementsMappingList: event.pdElemementMappingList, type: CreatItemType.DATA_ELEMENTS });
    this.prepareDataSource();
  }

  onCreateNewDataElement(event: any) {
    if (!event.newItem) {
      return
    }
    this.onAddNewPdElements(event.newItem)
    this.onNewItemAdded.emit({ pdElementsMappingList: [event.newItem], type: CreatItemType.DATA_ELEMENTS });
    this.prepareDataSource();
  }

  onAddNewPdElements(item: any) {
    const existingItem = this.selectedDataSubjectMapping.pdElementMappingList.find(pdEle => {
      return (pdEle.pdElement?.id === item?.id);
    });
    if (!existingItem) {
      const newMapping = new PdElementMapping({
        ...item,
        pdElement: { ...item },
        purpose: (item.purpose || []),
        selected: false,
        dataSubject: this.selectedDataSubjectMapping?.dataSubjectType,
        newItemId: item.id,
        newAdded: true
      });
      this.selectedDataSubjectMapping.pdElementMappingList.push(newMapping);


      this.updateDataSubjectSelectionState(this.selectedDataSubjectMapping);
    }
  }

  prepareDataSource() {
    const currentFilter = this.dataSource?.filter || '';
    this.dataSource = new MatTableDataSource((this.selectedDataSubjectMapping?.pdElementMappingList ?? []));
    this.setupDataSource();


    if (this.selectedDataSubjectMapping) {
      this.updateDataSubjectSelectionState(this.selectedDataSubjectMapping);
    }

    if (currentFilter) {
      this.dataSource.filter = currentFilter;
    }
  }

  get availableDataElements(): any[] {
    return this.createBpaService.newPdElementsList
  }

  isAllSelected(dataSubjectMapping: DataSubjectPdElemementMapping): boolean {
    if (!dataSubjectMapping?.pdElementMappingList?.length) return false;
    return dataSubjectMapping.pdElementMappingList.every(item => item.selected);
  }

  isSomeSelected(dataSubjectMapping: DataSubjectPdElemementMapping): boolean {
    if (!dataSubjectMapping?.pdElementMappingList?.length) return false;
    const selectedCount = dataSubjectMapping.pdElementMappingList.filter(item => item.selected).length;
    return selectedCount > 0 && selectedCount < dataSubjectMapping.pdElementMappingList.length;
  }

  getSelectedCount(dataSubjectMapping: DataSubjectPdElemementMapping): number {
    if (!dataSubjectMapping?.pdElementMappingList?.length) return 0;
    return dataSubjectMapping.pdElementMappingList.filter(item => item.selected).length;
  }

  onEditPdElement(pdElementMapping: PdElementMapping) {

    const dataElementData = pdElementMapping;
    const pdElement = dataElementData.pdElement;

    let categoryId = pdElement?.categoryId;
    const dialogRef = this.dialog.open(CreateItemDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: CreatItemType.DATA_ELEMENTS,
        editData: {
          id: pdElement?.id,
          name: pdElement?.name,
          categoryName: pdElement?.categoryName,
          classification: pdElement?.classification,
          categoryId: pdElement?.categoryIds || [],
          classificationId: pdElement?.classificationId || [],
          purpose: dataElementData.purpose || [],
          originalCategoryMappings: pdElement?.categoryMapping,
          originalClassificationMappings: pdElement?.classificationMapping,
          originalPurposeMappings: dataElementData.purpose || [],
        },
        purposeList: this.purposeList
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.item) {
        const categories = Array.isArray(result.item.categoryName) ? result.item.categoryName : [];
        const classifications = Array.isArray(result.item.classificationName) ? result.item.classificationName : [];
        pdElementMapping.pdElement = new PdElement({
          ...pdElement,
          pdBpaMappingId: pdElement?.originalPdBpaMapingId ?? 0,
          name: result.item.name,
          categoryId: result.item.categoryId,
          classificationId: result.item?.classificationId,
          categoryName: categories.length > 0 ? categories[0] : '',
          categoryNames: categories,
          classification: classifications,
          classificationName: classifications.length > 0 ? classifications[0] : '',
        })
        pdElementMapping.purpose = [...result.item.purpose]
        this.prepareDataSource();
        this.onUpdatePdElements.emit({ type: 'edit', selectedDataSubjectIndex: this.selectedDataSubjectIndex, pdElementMapping: pdElementMapping })
      }
    });
  }

  onDeletePdElement(pdElementMapping: PdElementMapping, index: number) {
    let sourceName = ''
    if (!pdElementMapping || !pdElementMapping?.pdElement) {
      console.error('Invalid data:', pdElementMapping);
      return;
    }
    sourceName = pdElementMapping.pdElement.name || 'Unknown';
    this.openConfirmationDialog(sourceName, index, pdElementMapping)
  }

  openConfirmationDialog(itemName: string, index: number, pdElementMapping: PdElementMapping,) {
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
        this.deleteRow(index, pdElementMapping);
      }
    });
  }

  deleteRow(index: number, pdElementMapping: PdElementMapping) {
    this.selectedDataSubjectMapping.pdElementMappingList.splice(index, 1);
    const dataSubject: any = this.selectedDataSubjectMapping.dataSubjectType;
    this.createBpaService.onDeletePdElement(dataSubject, pdElementMapping);


    this.updateDataSubjectSelectionState(this.selectedDataSubjectMapping);

    this.prepareDataSource();
    this.onUpdatePdElements.emit({ type: 'delete', selectedDataSubjectIndex: this.selectedDataSubjectIndex, pdElementMapping: pdElementMapping })
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

  applySearchFilter() {
    if (this.searchText) {
      const filterValue = this.searchText.trim().toLowerCase();
      this.dataSource.filter = filterValue;
    } else {
      this.dataSource.filter = '';
    }
  }

  setupDataSource() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.getFilterPredicate();

    if (this.searchText && this.searchText.trim()) {
      this.dataSource.filter = this.searchText.trim().toLowerCase();
    }
  }

  private getFilterPredicate() {
    return (data: any, filter: string) => {
      if (!filter) return true;

      const searchStr = filter.toLowerCase();

      const pdElement = data.pdElement
      return (
        pdElement?.name?.toLowerCase().includes(searchStr) ||
        pdElement?.categoryName?.toLowerCase().includes(searchStr) ||
        this.getSensitivityText(pdElement?.sensitivity)?.toLowerCase().includes(searchStr) ||
        this.getPurposeNames(data.purpose)?.toLowerCase().includes(searchStr)
      );
    };
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

  get isEditMode() {
    return this.bpaService.isEditMode;
  }

}

