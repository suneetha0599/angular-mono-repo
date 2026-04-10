import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  Input,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { AddPdElementsDialogComponent } from '../add-pd-elements-dialog/add-pd-elements-dialog.component';
import { PD_ELEMENTS_MENU } from '../constant';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { DialogService } from '@admin-core/services/dialog.service';
import {
  PopupDialogComponent,
  PopupDialogData,
} from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PdElementService } from '@admin-core/services/pdElement/pd-element.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';

@Component({
  selector: 'app-data-element',
  imports: [
    CommonModule,
    EllipsisTooltipDirective,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatTooltipModule,
    ItemNotFoundComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './data-element.component.html',
  styleUrl: './data-element.component.scss',
})
export class DataElementComponent {
  @Input() refreshElements!: boolean;
  @Input() searchText!: string;
  @ViewChild(MatSort) sort!: MatSort;
  private dialogService = inject(DialogService);
  sortByField: string = '';
  sortDirection: string = '';
  originalElements: any[] = [];
  dataElementFullAcess: boolean = false;
  loading: boolean = false;
  requestLoading = true;
  shimmerRows = Array.from({ length: 8 }).map(() => ({
    elementName: '',
    category: '',
    classification: '',
    action: '',
  }));
  menu = PD_ELEMENTS_MENU;
  displayedColumns: string[] = [
    'elementName',
    'category',
    'classification',
    'action',
  ];
  initialListIsEmpty: boolean = false;
  dataSource = new MatTableDataSource<any>();
  hasApiError: boolean = false;
  private rolePermissionService = inject(RolePermissionService);

  private configApiHelperService = inject(ConfigApiHelperService);
  private pdElementService = inject(PdElementService);
  constructor(
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    this.getPdElements(this.searchText, this.sortByField, this.sortDirection);
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.dataElementFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['refreshElements'] && !changes['refreshElements'].firstChange) {
      this.getPdElements(this.searchText, this.sortByField, this.sortDirection);
    }

    if (changes['searchText'] && !changes['searchText'].firstChange) {
      this.applyLocalFilter();
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'elementName':
          return item.name;
        case 'category':
          return item.categoryName;
        case 'classification':
          return item.classification;
        default:
          return item[property];
      }
    };
  }

  applyLocalFilter() {
    const search = (this.searchText || '').toLowerCase().trim();

    if (!search) {
      this.dataSource.data = [...this.originalElements];
      return;
    }

    this.dataSource.data = this.originalElements.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search)
      )
    );
  }

  async getPdElements(
    searchText: string = '',
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    this.loading = true;
    this.hasApiError = false;
    try {
      const pdElements = await this.pdElementService.getPdElementMasterList();
      if (pdElements?.length) {
        this.originalElements = pdElements.map((el: any) => ({
          ...el,

          categoryName: this.mapCategoryNames(el.categoryMappings),
          classification: this.mapClassificationNames(el.classificationMappings),
        }));
        this.applyLocalFilter();
      } else {
        this.initialListIsEmpty = true;
      }

      this.requestLoading = this.dataSource.data.length > 0;
    } catch (e) {
      this.hasApiError = true
    } finally {
      this.loading = false;
    }
  }

  sortFieldMapping: any = {
    elementName: 'elementName',
  };

  get errorTitle() {
    return (this.searchText
      ? `No data elements match your search criteria`
      : `No data elements have been created yet`)
  }

  // onSortChange(event: Sort) {
  //   const backendField = this.sortFieldMapping[event.active];

  //   this.sortByField = backendField ?? '';
  //   this.sortDirection = event.direction ? event.direction.toUpperCase() : '';

  //   this.getPdElements(this.searchText, this.sortByField, this.sortDirection);
  // }

  onSortChange(event: Sort) {
    if (!event.active || event.direction === '') {
      this.dataSource.data = [...this.originalElements];
      this.applyLocalFilter();
      return;
    }

    const property = event.active;
    const direction = event.direction === 'asc' ? 1 : -1;
    const sortedData = [...this.dataSource.data].sort((a, b) => {
      const valueA = this.dataSource.sortingDataAccessor!(a, property);
      const valueB = this.dataSource.sortingDataAccessor!(b, property);

      return (valueA < valueB ? -1 : valueA > valueB ? 1 : 0) * direction;
    });

    this.dataSource.data = sortedData;
  }

  async onDeleteClick(element: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this data elements?',
        confirmationDetail: element.name || `ID ${element.id}`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600',
      } as PopupDialogData,
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      try {
        const res = await this.configApiHelperService.onDeletePdElements(
          element.id
        );
        this.pdElementService.deletPdElement(element.id);
        if (res?.success) {
          this.dataSource.data = this.dataSource.data.filter(
            (item) => item !== element
          );
          await this.getPdElements(
            this.searchText,
            this.sortByField,
            this.sortDirection
          );
        }
      } catch (error) {
        console.error('Error deleting PD element:', error);
      }
    });
  }

  private mapCategoryNames(mappings: any[] = []): string {
    return mappings
      .map(m => m.categoryName)
      .join(', ');
  }

  private mapClassificationNames(mappings: any[] = []): string {
    return mappings
      .map(m => m.classificationName)
      .join(', ');
  }

  async onEditClick(element: any) {
    const dialogRef = this.dialog.open(AddPdElementsDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        viewMode: false,
        editMode: true,
        elementData: element,
        menuName: this.menu[0].name,
      },
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      if (res?.success) {
        await this.getPdElements(
          this.searchText,
          this.sortByField,
          this.sortDirection
        );
      }
    });
  }

  async onViewClick(element: any) {
    const dialogRef = this.dialog.open(AddPdElementsDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      panelClass: 'dialog-wrapper',
      disableClose: true,

      data: {
        viewMode: true,
        elementData: element,
        menuName: this.menu[0].name,
      },
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      if (res?.success) {
        await this.getPdElements(
          this.searchText,
          this.sortByField,
          this.sortDirection
        );
      }
    });
  }

  get isEmptyRequest() {
    return this.dataSource.filteredData?.length ? false : true
  }
}
