import { CommonModule } from '@angular/common';
import {
  Component,
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
  selector: 'app-classification',
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

  templateUrl: './classification.component.html',
  styleUrl: './classification.component.scss',
})
export class ClassificationComponent {
  @Input() refreshElements!: boolean;
  @Input() searchText!: string;
  @ViewChild(MatSort) sort!: MatSort;
  private dialogService = inject(DialogService);
  sortByField: string = '';
  sortDirection: string = '';
  originalElements: any[] = [];
  activeSort: Sort | null = null;
  initialListIsEmpty: boolean = false;
  dataClassificationFullAcess: boolean = false;

  requestLoading = true;
  loading: boolean = false;

  menu = PD_ELEMENTS_MENU;
  displayedColumns: string[] = ['name', 'description', 'action'];
  dataSource = new MatTableDataSource<any>();
  hasApiError: boolean = false;

  private configApiHelperService = inject(ConfigApiHelperService);
  private pdElementService = inject(PdElementService);
  private rolePermissionService = inject(RolePermissionService);
  constructor(
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    this.getClassfication(
      this.searchText,
      this.sortByField,
      this.sortDirection
    );
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.dataClassificationFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['refreshElements'] && !changes['refreshElements'].firstChange) {
      this.getClassfication(
        this.searchText,
        this.sortByField,
        this.sortDirection
      );
    }

    if (changes['searchText'] && !changes['searchText'].firstChange) {
      this.applySearchAndSort();
    }
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'name':
          return item.name;
        case 'description':
          return item.description;
        default:
          return item[property];
      }
    };
  }

  applySearchAndSort() {
    let data = [...this.originalElements];
    const search = (this.searchText || '').toLowerCase().trim();
    if (search) {
      data = data.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(search)
        )
      );
    }
    if (this.activeSort?.direction) {
      const dir = this.activeSort.direction === 'asc' ? 1 : -1;
      const prop = this.activeSort.active;

      data.sort((a, b) => {
        const v1 = this.dataSource.sortingDataAccessor!(a, prop);
        const v2 = this.dataSource.sortingDataAccessor!(b, prop);
        return (v1 < v2 ? -1 : v1 > v2 ? 1 : 0) * dir;
      });

      Promise.resolve().then(() => {
        this.sort.active = prop;
        this.sort.direction = this.activeSort!.direction;
      });
    }

    this.dataSource.data = data;
  }

  async getClassfication(
    searchText: string = '',
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    let params = {
      searchText: searchText,
      sortBy: sortBy,
      sortDirection: sortDirection,
    };
    this.loading = true;
    this.hasApiError = false;
    try {
      const classifiation = await this.pdElementService.getClassification();
      console.log(classifiation, 'classifiation');

      if (classifiation && classifiation.length) {
        this.originalElements = classifiation;
        this.applySearchAndSort();
      } else {
        this.initialListIsEmpty = true;
      }

      if (this.dataSource.data.length > 0) {
        this.requestLoading = true;
      } else {
        this.requestLoading = false;
      }
    } catch (e) { this.hasApiError = true }
    finally {
      this.loading = false;
    }
  }

  sortFieldMapping: any = {
    name: 'name',
    description: 'description',
  };

  shimmerRows = Array.from({ length: 8 }).map(() => ({
    name: '',
    description: '',
    action: '',
  }));

  onSortChange(event: Sort) {
    this.activeSort = event;
    this.sort.active = event.active;
    this.sort.direction = event.direction;

    this.applySearchAndSort();
  }

  async refreshTableData() {
    await this.getClassfication(this.searchText, '', '');

    if (this.activeSort?.direction) {
      this.onSortChange(this.activeSort);
    }
  }

  async onDeleteClick(element: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Data Classification?',
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
        const res = await this.configApiHelperService.onDeletePdClassification(
          element.id
        );
        this.pdElementService.deletClassfication(element.id);
        if (res?.success) {
          this.dataSource.data = this.dataSource.data.filter(
            (item) => item !== element
          );
          await this.refreshTableData();
        }
      } catch (error) {
        console.error('Error deleting Classification:', error);
      }
    });
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
        menuName: this.menu[2].name,
      },
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      if (res.success) {
        await this.refreshTableData();
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
        menuName: this.menu[2].name,
      },
    });

    dialogRef.afterClosed().subscribe(async (res) => {
      if (res?.success) {
        await this.getClassfication(
          this.searchText,
          this.sortByField,
          this.sortDirection
        );
      }
    });
  }

  get isEmptyRequest() {
    return this.dataSource?.filteredData?.length ? false : true
  }

  get errorTitle() {
    return (this.searchText
      ? `No data classifications match your search criteria`
      : `No data classifications have been created yet`)
  }
}
