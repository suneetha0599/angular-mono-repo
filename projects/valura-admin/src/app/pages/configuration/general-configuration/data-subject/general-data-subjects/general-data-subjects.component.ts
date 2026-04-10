import {
  Component,
  Input,
  inject,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService as ConfigurationService } from '@admin-core/services/network/configuration/api-helper.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { AddDataSubjectComponent } from '../add-data-subject/add-data-subject.component';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { DataSubjectService } from '@admin-core/services/dataSubject/data-subject.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';

@Component({
  selector: 'app-general-data-subjects',
  standalone: true,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    EllipsisTooltipDirective,
    ItemNotFoundComponent,
    MatSortModule,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './general-data-subjects.component.html',
  styleUrls: ['./general-data-subjects.component.scss'],
})
export class GeneralDataSubjectsComponent {

  @Input() searchText!: string;
  @Input() refreshElements!: boolean;

  requestLoading = true;
  dataSubjectFullAcess: boolean = false;
  dataSource = new MatTableDataSource<any>([]);
  dataSubjectList: any[] = [];
  originalList: any[] = [];
  initialListIsEmpty: boolean = false;
  private rolePermissionService = inject(RolePermissionService);


  displayedColumns: string[] = ['name', 'description', 'action'];

  private snackbarService = inject(SnackbarService);
  private configurationService = inject(ConfigurationService);
  private dataSubjectService = inject(DataSubjectService)

  dialogRef: MatDialogRef<any> | null = null;
  private dialog = inject(MatDialog);
  hasApiError: boolean = false;

  ngOnInit(): void {
    this.loadDataSubject(this.searchText, this.sortByField, this.sortDirection);
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.dataSubjectFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  async loadDataSubject(
    searchText: string = '',
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    let params = {
      searchText: searchText,
      sortBy: sortBy,
      sortDirection: sortDirection,
    };
    try {
      this.hasApiError = false;
      this.requestLoading = true;
      const res = await this.dataSubjectService.getDatasubjectMasterList(false, params);
      if (res && res.length) {
        this.dataSubjectList = res.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description,
        }));
        this.originalList = [...this.dataSubjectList];
        this.applyLocalFilter();
      } else {
        this.initialListIsEmpty = true;
      }
    } catch (error) {
      console.log(error)
      this.hasApiError = true;
    } finally {
      this.requestLoading = false;
    }
  }

  get errorTitle() {
    return (this.searchText
      ? `No data subjects match your search criteria`
      : `No data subjects have been created yet`)
  }

  applyLocalFilter() {
    const search = (this.searchText || '').toLowerCase().trim();

    let filtered = [...this.originalList];

    if (search) {
      filtered = this.originalList.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(search)
        )
      );
    }

    this.dataSource = new MatTableDataSource(filtered);
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['refreshElements'] && !changes['refreshElements'].firstChange) {
      this.loadDataSubject(
        this.searchText,
        this.sortByField,
        this.sortDirection
      );
    }

    // if (changes['searchText'] && !changes['searchText'].firstChange) {
    //   this.loadDataSubject(
    //     this.searchText,
    //     this.sortByField,
    //     this.sortDirection
    //   );
    // }

    if (changes['searchText'] && !changes['searchText'].firstChange) {
      this.applyLocalFilter();
    }

  }

  @ViewChild(MatSort) sort!: MatSort;

  sortByField: string = '';
  sortDirection: string = '';

  sortFieldMapping: any = {
    name: 'name',
    description: 'description',
  };

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];

    this.sortByField = backendField ?? '';
    this.sortDirection = event.direction ? event.direction.toUpperCase() : '';

    this.loadDataSubject(this.searchText, this.sortByField, this.sortDirection);
  }

  onEdit(element: any) {
    const dialogRef = this.dialog.open(AddDataSubjectComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: false,
      panelClass: 'dialog-wrapper',

      data: {
        dataSubject: element.id,
        editMode: true,
        viewMode: false
      }
    });


    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadDataSubject(
          this.searchText,
          this.sortByField,
          this.sortDirection
        );
      }
    });
  }

  onView(element: any) {
    const dialogRef = this.dialog.open(AddDataSubjectComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: false,
      panelClass: 'dialog-wrapper',

      data: {
        dataSubject: element.id,
        editMode: false,
        viewMode: true
      }
    });



    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadDataSubject(
          this.searchText,
          this.sortByField,
          this.sortDirection
        );
      }
    });
  }

  onDelete(row: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this Data Subject?',
        confirmationDetail: row.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });


    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      try {
        await this.configurationService.deleteDataSubject(row.id);
        await this.dataSubjectService.deletDataSubject(row.id);
        this.dialogRef?.close();
        this.loadDataSubject(
          this.searchText,
          this.sortByField,
          this.sortDirection
        );
      } catch (error) {
        console.error('Error deleting Data Subject:', error);
      }
    });
  }

  get isEmptyRequest() {
    return this.dataSource?.filteredData?.length ? false : true
  }
}
