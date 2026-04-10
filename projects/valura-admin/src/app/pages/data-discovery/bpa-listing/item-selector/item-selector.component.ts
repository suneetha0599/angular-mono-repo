import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateItemDialogComponent } from '../create-item-dialog/create-item-dialog.component';
import { PdElementService } from '@admin-core/services/pdElement/pd-element.service';
import { PdElements } from '@admin-core/models/configuration/regulation';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ApiHelperService } from '@admin-core/services/network/data-inventory/api-helper.service';
import { CreateBpaService } from '@admin-core/services/bpa/create-bpa.service';
import { BpaRecepient, CreatItemType, Recipient, SOURCE_CATEGORY } from '../constants';
import { formatStatus } from '@admin-page/request-management/request-utils';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { DbService } from '@admin-core/services/db/db.service';

export interface SelectorConfig {
  type: CreatItemType;
  placeholder?: string;
  title?: string;
}

export interface SelectorItem {
  id: number;
  name: string;
  categoryName?: string;
  classificationId?: number
  classification?: string
  type?: string;
  category?: string;
  categoryNames?: string[];
  categoryIds?: number[];
  isLocal?: boolean;
  [key: string]: any;
  addedBySource?: boolean
}

@Component({
  selector: 'app-item-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    LoadingButtonComponent
  ],
  templateUrl: './item-selector.component.html',
  styleUrls: ['./item-selector.component.scss']
})
export class ItemSelectorComponent implements OnInit, OnChanges {
  @Input() config!: SelectorConfig;
  @Input() availableItems: SelectorItem[] = [];
  @Input() selectedDataSubject?: any;
  @Input() alreadyAddedItems: any[] = [];
  @Output() onItemsSelected = new EventEmitter<{ pdElemementMappingList: any[] }>();
  @Output() onCreateNew = new EventEmitter<any>();

  @ViewChild('dropdownPanel') dropdownPanel!: ElementRef;

  private pdElementService = inject(PdElementService);
  private dialog = inject(MatDialog);
  private dataInventoryApiHelperService = inject(ApiHelperService);
  private createBpaService = inject(CreateBpaService);
  private snackbarService = inject(SnackbarService);
  private dbService = inject(DbService);

  isOpen = false;
  searchValue = '';
  selectedItems: Map<string, any> = new Map();
  filteredItems: SelectorItem[] = [];
  allPdElements: SelectorItem[] = [];
  isLoading = false;
  private localItemCounter = 0;
  private currentPage = 0;
  private readonly pageSize = 10;
  private hasMoreData = true;
  isLoadingMore = false;

  recipientCurrentPage = 0;
  hasMoreRecipients = true;
  isLoadingMoreRecipients = false;

  private sourceCurrentPage = 0;
  private hasMoreSources = true;
  isLoadingMoreSources = false;
  CreatItemType = CreatItemType;

  async ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['availableItems'] && this.config.type !== CreatItemType.DATA_ELEMENTS && this.config.type !== CreatItemType.ASSET && this.config.type !== CreatItemType.SOURCE && this.config.type !== CreatItemType.RECEPIENT) {
      this.filteredItems = [...this.availableItems];
      this.allPdElements = [...this.availableItems];
    }

    if (changes['alreadyAddedItems'] && this.alreadyAddedItems) {
      this.syncSelectedItems();
    }


    if (changes['config'] && (this.config.type === CreatItemType.DATA_ELEMENTS || this.config.type === CreatItemType.ASSET || this.config.type === CreatItemType.SOURCE || this.config.type === CreatItemType.RECEPIENT)) {
      this.loadDataBasedOnType();
    }
  }

  private syncSelectedItems() {
    const currentAddedIds = new Set(this.alreadyAddedItems.map(added => {
      return added.id || added.pdElement?.id || added.recipient?.id || added.source?.id || added.asset?.id;
    }));
    this.selectedItems.forEach((value, key) => {
      const itemId = value.id;
      if (currentAddedIds.has(itemId)) {
        this.selectedItems.delete(key);
      }
    });
  }

  isItemDisabled(item: SelectorItem): boolean {
    if (!this.alreadyAddedItems || !this.alreadyAddedItems.length) return false;
    return this.alreadyAddedItems.some(added => {
      if (added.id === item.id) return true;
      const nestedId = added.pdElement?.id || added.recipient?.id || added.source?.id || added.asset?.id;
      return nestedId === item.id;
    });
  }


  private async loadDataBasedOnType() {
    switch (this.config.type) {
      case CreatItemType.DATA_ELEMENTS:
        await this.loadPdElements();
        break;
      case CreatItemType.ASSET:
        await this.loadAssets(true);
        break;
      case CreatItemType.SOURCE:
        await this.loadSources(true);
        break;
      case CreatItemType.RECEPIENT:
        await this.loadRecipients(true);
        break;
      default:
        this.filteredItems = [...this.availableItems];
        this.allPdElements = [...this.availableItems];
    }
  }

  private getServiceItemsForType(): SelectorItem[] {
    switch (this.config.type) {
      case CreatItemType.DATA_ELEMENTS:
        return this.createBpaService.newPdElementsList.map(item => ({
          id: item.id,
          name: item.name,
          categoryName: item.categoryName?.[0],
          categoryId: item.categoryId?.[0],
          classificationId: item.classificationId?.[0],
          classification: item.classification?.[0],
          isLocal: true
        }));

      case CreatItemType.SOURCE:
        const mappedAssets = this.createBpaService.newAssetList.filter(a => !a?.addedBySource).map(item => ({
          id: item.id,
          name: item.name,
          type: '',
          category: SOURCE_CATEGORY.ASSET,
          categoryName: SOURCE_CATEGORY.ASSET,
          hostingSite: item.hostingSite,
          isLocal: true
        }));
        const mappedSources = this.createBpaService.newSourceList.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          categoryName: item.category,
          type: item.type,
          isLocal: true,
          addedBySource: item?.addedBySource ?? false,
          assetId: item?.assetId ?? 0,
          tempSourceId: item?.tempSourceId ?? 0
        }));
        return [
          ...mappedAssets,
          ...mappedSources
        ];
      case CreatItemType.ASSET:
        return this.createBpaService.newAssetList.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          categoryName: item.categoryName,
          hostingSite: item.hostingSite,
          category: item.category,
          isLocal: true,
          addedBySource: item?.addedBySource ?? false,
        }));
      case CreatItemType.RECEPIENT:
        return this.createBpaService.newRecepientList.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          categoryName: item.category,
          purpose: item.purpose,
          count: item.count,
          isLocal: true
        }));
      default:
        return [];
    }
  }

  private async loadRecipients(reset: boolean = false) {
    try {
      if (reset) {
        this.recipientCurrentPage = 0;
        this.hasMoreRecipients = true;
        this.isLoading = true;
      } else {
        this.isLoadingMoreRecipients = true;
      }

      const params: any = {
        page: this.recipientCurrentPage + 1,
        size: this.pageSize
      };

      if (this.searchValue && this.searchValue.trim() !== '') {
        params.searchQuery = this.searchValue.trim();
      }

      let dbRecipients: SelectorItem[] = [];


      if (reset || this.recipientCurrentPage === 0) {
        try {
          const departmentData = await this.dbService.getAllDepartmentsByName((params?.searchQuery ?? ''));
          if (departmentData && Array.isArray(departmentData)) {
            const departmentRecipients = departmentData.map((department: any) => ({
              id: department.id,
              name: department.name,
              category: Recipient.DEPARTMENT,
              categoryName: Recipient.DEPARTMENT.toLowerCase(),
              type: Recipient.DEPARTMENT,
              isLocal: false
            }));
            dbRecipients = [...dbRecipients, ...departmentRecipients];
          }
        } catch (deptError) {
          console.error('Error loading departments from local DB:', deptError);
        }
      }


      const recipientData = await this.dataInventoryApiHelperService.getRecipientMasterList(params);

      if (recipientData?.recipientMasters) {
        const masterRecipients = recipientData.recipientMasters.map((recipient: any) => ({
          id: recipient.id,
          name: recipient.name,
          category: recipient.type,
          categoryName: recipient.type,
          type: recipient.type,
          isLocal: false
        }));
        dbRecipients = [...dbRecipients, ...masterRecipients];
      }

      this.hasMoreRecipients = recipientData?.recipientMasters?.length === this.pageSize;

      const serviceItems = reset ? this.getServiceItemsForType() : [];

      if (reset) {
        this.allPdElements = [...serviceItems, ...dbRecipients];
      } else {
        this.allPdElements = [...this.allPdElements, ...dbRecipients];
      }

      this.filteredItems = [...this.allPdElements];

    } catch (error) {
      console.error('Error loading recipients:', error);
      if (reset) {
        const serviceItems = this.getServiceItemsForType();
        this.allPdElements = [...serviceItems];
        this.filteredItems = [...serviceItems];
      }
      this.hasMoreRecipients = false;
    } finally {
      this.isLoading = false;
      this.isLoadingMoreRecipients = false;
    }
  }
  private async loadMoreRecipients() {
    if (!this.hasMoreRecipients || this.isLoadingMoreRecipients) {
      return;
    }

    this.recipientCurrentPage++;
    await this.loadRecipients(false);
  }

  private async loadPdElements() {
    try {
      this.isLoading = true;
      const pdElements = await this.pdElementService.getPdElementMasterList();
      let dbElements: SelectorItem[] = [];
      if (pdElements && pdElements.length > 0) {
        dbElements = pdElements.map((pdElement: any) => {
          const categories = pdElement.categoryMappings ?? [];
          const classification = pdElement.classificationMappings ?? [];
          return {
            id: pdElement.id,
            name: pdElement.name,
            categoryNames: categories.map((c: any) => c.categoryName),
            categoryIds: categories.map((c: any) => c.categoryId),
            categoryName: categories[0]?.categoryName,
            classificationId: classification.map((c: any) => c.classificationId),
            classification: classification.map((c: any) => c.classificationName),
            classificationMapping: classification,
            categoryMapping: categories,
            isLocal: false
          };
        });
      }

      const serviceItems = this.getServiceItemsForType();

      this.allPdElements = [...dbElements, ...serviceItems];
      this.allPdElements.sort((a, b) => b.id - a.id);
      this.filteredItems = [...this.allPdElements];

    } catch (error) {
      console.error('Error loading PD elements:', error);
      const serviceItems = this.getServiceItemsForType();
      this.allPdElements = [...serviceItems];
      this.filteredItems = [...serviceItems];
    } finally {
      this.isLoading = false;
    }
  }


  formatCategory(value: string): string {
    return formatStatus(value);
  }

  private async loadAssets(reset: boolean = false) {
    try {
      if (reset) {
        this.currentPage = 0;
        this.hasMoreData = true;
        this.isLoading = true;
      } else {
        this.isLoadingMore = true;
      }

      const params: any = {
        page: this.currentPage + 1,
        size: this.pageSize,
        type: 'ASSET'
      };

      if (this.searchValue && this.searchValue.trim() !== '') {
        params.searchQuery = this.searchValue.trim();
      }

      const data = await this.dataInventoryApiHelperService.getSourceMasterList(params);

      let dbAssets: SelectorItem[] = [];

      if (data?.sourceMasters) {
        dbAssets = data.sourceMasters.map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          type: asset.assetType,
          category: asset.assetType,
          categoryName: asset.assetCategory,
          hostingSite: asset.hostingSite || '',
          isLocal: false
        }));

        this.hasMoreData = dbAssets.length === this.pageSize;
      } else {
        this.hasMoreData = false;
      }

      const serviceItems = reset ? this.getServiceItemsForType() : [];

      if (reset) {
        this.allPdElements = [...serviceItems, ...dbAssets];
      } else {
        this.allPdElements = [...this.allPdElements, ...dbAssets];
      }

      this.filteredItems = [...this.allPdElements];

    } catch (error) {
      console.error('Error loading assets:', error);
      if (reset) {
        const serviceItems = this.getServiceItemsForType();
        this.allPdElements = [...serviceItems];
        this.filteredItems = [...serviceItems];
      }
      this.hasMoreData = false;
    } finally {
      this.isLoading = false;
      this.isLoadingMore = false;
    }
  }

  onScroll(event: any) {
    if ((this.config.type !== CreatItemType.ASSET && this.config.type !== CreatItemType.RECEPIENT && this.config.type !== CreatItemType.SOURCE) ||
      this.isLoadingMore || this.isLoadingMoreRecipients || this.isLoadingMoreSources) {
      return;
    }

    const element = event.target;
    const threshold = 50;

    if (element.scrollHeight - element.scrollTop - element.clientHeight < threshold) {
      if (this.config.type === CreatItemType.ASSET) {
        this.loadMoreAssets();
      } else if (this.config.type === CreatItemType.RECEPIENT) {
        this.loadMoreRecipients();
      } else if (this.config.type === CreatItemType.SOURCE) {
        this.loadMoreSources();
      }
    }
  }


  private async loadMoreAssets() {
    if (!this.hasMoreData || this.isLoadingMore) {
      return;
    }

    this.currentPage++;
    await this.loadAssets(false);
  }

  private async loadSources(reset: boolean = false) {
    try {
      if (reset) {
        this.sourceCurrentPage = 0;
        this.hasMoreSources = true;
        this.isLoading = true;
      } else {
        this.isLoadingMoreSources = true;
      }

      const params: any = {
        page: this.sourceCurrentPage + 1,
        size: this.pageSize
      };


      if (this.searchValue && this.searchValue.trim() !== '') {
        params.searchQuery = this.searchValue.trim();
      }

      const data = await this.dataInventoryApiHelperService.getSourceMasterList(params);

      let dbSources: SelectorItem[] = [];

      if (data?.sourceMasters) {

        dbSources = data.sourceMasters.map((source: any) => {

          return {
            id: source.id,
            name: source.name,
            type: source.type === SOURCE_CATEGORY.ASSET ? '' : source.sourceType,
            category: source.type,
            categoryName: source.type,
            isLocal: false,
            sourceType: source.type === SOURCE_CATEGORY.ASSET ? source.assetType : source.sourceType,
          };
        });

        this.hasMoreSources = dbSources.length === this.pageSize;
      } else {
        this.hasMoreSources = false;
      }

      const serviceItems = reset ? this.getServiceItemsForType() : [];

      if (reset) {
        this.allPdElements = [...serviceItems, ...dbSources];
      } else {
        this.allPdElements = [...this.allPdElements, ...dbSources];
      }

      this.filteredItems = [...this.allPdElements];

    } catch (error) {
      console.error('Error loading sources:', error);
      if (reset) {
        const serviceItems = this.getServiceItemsForType();
        this.allPdElements = [...serviceItems];
        this.filteredItems = [...serviceItems];
      }
      this.hasMoreSources = false;
    } finally {
      this.isLoading = false;
      this.isLoadingMoreSources = false;
    }
  }


  private async loadMoreSources() {
    if (!this.hasMoreSources || this.isLoadingMoreSources) {
      return;
    }

    this.sourceCurrentPage++;
    await this.loadSources(false);
  }




  toggleDropdown() {
    if (!this.selectedDataSubject && this.config.type === CreatItemType.DATA_ELEMENTS) {
      this.snackbarService.openSnack("Data subject is required!");
      return
    }
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this.config.type === CreatItemType.DATA_ELEMENTS || this.config.type === CreatItemType.ASSET ||
        this.config.type === CreatItemType.SOURCE || this.config.type === CreatItemType.RECEPIENT) {
        if (this.filteredItems.length === 0) {
          this.loadDataBasedOnType();
        }
      } else {
        this.filteredItems = [...this.availableItems];
      }
    }
  }



  closeDropdown() {
    this.isOpen = false;
  }
  onSearch() {
    const search = this.searchValue.trim().toLowerCase();

    if (this.config.type === CreatItemType.ASSET || this.config.type === CreatItemType.RECEPIENT || this.config.type === CreatItemType.SOURCE) {
      if (this.config.type === CreatItemType.ASSET) {
        this.loadAssets(true);
      } else if (this.config.type === CreatItemType.RECEPIENT) {
        this.loadRecipients(true);
      } else if (this.config.type === CreatItemType.SOURCE) {
        this.loadSources(true);
      }
    } else {
      const sourceArray = (this.config.type === CreatItemType.DATA_ELEMENTS)
        ? this.allPdElements
        : this.availableItems;

      if (!search) {
        this.filteredItems = [...sourceArray];
        return;
      }

      this.filteredItems = sourceArray.filter(item => {
        const nameMatch = item.name?.toLowerCase().includes(search);
        const singleCategoryMatch =
          item.categoryName?.toLowerCase().includes(search);
        const multiCategoryMatch =
          item.categoryNames?.some(cat =>
            cat.toLowerCase().includes(search)
          );
        return nameMatch || singleCategoryMatch || multiCategoryMatch;
      });
    }
  }


  clearSearch() {
    this.searchValue = '';

    if (this.config.type === CreatItemType.ASSET) {
      this.loadAssets(true);
    } else if (this.config.type === CreatItemType.RECEPIENT) {
      this.loadRecipients(true);
    } else if (this.config.type === CreatItemType.SOURCE) {
      this.loadSources(true);
    } else {
      this.onSearch();
    }
  }



  getItemKey(item: SelectorItem): string {
    const category = item.category || item.categoryName || 'unknown';
    return `${category}-${item.id}`;
  }

  isItemSelected(item: SelectorItem): boolean {
    return this.isItemDisabled(item) || this.selectedItems.has(this.getItemKey(item));
  }
  toggleItem(item: SelectorItem, event: any) {
    if (this.isItemDisabled(item)) return;
    const itemKey = this.getItemKey(item);
    if (event.checked) {
      this.selectedItems.set(itemKey, item);
      this.scrollToLatestChip();
    } else {
      this.selectedItems.delete(itemKey);
    }
  }

  private scrollToLatestChip(): void {
    setTimeout(() => {
      const container = document.querySelector('.selected-chips-container') as HTMLElement;
      if (container) {
        container.scrollTo({
          left: container.scrollWidth,
          behavior: 'smooth'
        });
      }
    }, 50);
  }


  get selectedCount(): number {
    return this.selectedItems.size;
  }

  getSelectedChips(): SelectorItem[] {
    return Array.from(this.selectedItems.values());
  }

  removeChip(item: SelectorItem) {
    const itemKey = this.getItemKey(item);
    this.selectedItems.delete(itemKey);
  }

  getPlaceholder(): string {
    return this.config.placeholder || `Add ${this.config.type}s`;
  }

  onCreateNewClick() {
    const dialogRef = this.dialog.open(CreateItemDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: this.config.type
      }
    });


    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.item) {
        await this.loadDataBasedOnType();
        if (result?.item) {
          this.onCreateNew.emit({ newItem: result.item })
        }
      }
    });
  }

  onSaveClick() {
    const pdElementMappingList = Array.from(this.selectedItems.values()).map(item => {
      // const pdElementMapping: any = {
      //   selected: true,
      //   purpose: [],
      //   dataSubject: this.selectedDataSubject ? {
      //     id: this.selectedDataSubject.id,
      //     name: this.selectedDataSubject.name,
      //     dsBpaMappingId: this.selectedDataSubject.dsBpaMappingId || 0
      //   } : undefined,
      //   pdElement: {
      //     id: item.id,
      //     name: item.name,
      //     categoryName: item.categoryName,
      //     sensitivity: item.sensitivity,
      //     type: item.type,
      //     sourceType: item.type, //bpa related type
      //     category: item.category,
      //     purpose: item.purpose,
      //     count: item.count
      //   }
      // };
      return item;
    });

    this.onItemsSelected.emit({
      pdElemementMappingList: pdElementMappingList
    });

    this.closeDropdown();
    this.selectedItems.clear();
    this.searchValue = '';
    this.onSearch();
  }

  getSensitivityColor(sensitivity: string): string {
    const colors: { [key: string]: string } = {
      'LOW': '#E8F5E9',
      'MEDIUM': '#FFF3E0',
      'HIGH': '#FFEBEE',
      'CRITICAL': '#FCE4EC'
    };
    return colors[sensitivity?.toUpperCase()] || '#F5F5F5';
  }

  getSensitivityTextColor(sensitivity: string): string {
    const colors: { [key: string]: string } = {
      'LOW': '#2E7D32',
      'MEDIUM': '#F57C00',
      'HIGH': '#C62828',
      'CRITICAL': '#880E4F'
    };
    return colors[sensitivity?.toUpperCase()] || '#424242';
  }

  getSearchPlaceholder(): string {
    switch (this.config.type) {
      case CreatItemType.DATA_ELEMENTS:
        return 'Find Data Elements';
      case CreatItemType.ASSET:
        return 'Find Assets';
      case CreatItemType.SOURCE:
        return 'Find Sources';
      case CreatItemType.RECEPIENT:
        return 'Find Recipients';
      default:
        return 'Find Items';
    }
  }

  formatDisplayText(item: any) {
    const displayText = (item.category || item.categoryName) ?? ''
    return formatStatus(displayText)
  }
}
