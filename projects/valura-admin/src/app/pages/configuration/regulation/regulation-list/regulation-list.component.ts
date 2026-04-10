import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { Component, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { ConfigService } from '@admin-core/services/config.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RegulationCreateComponent } from '../regulation-create/regulation-create.component';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';

@Component({
  selector: 'app-regulation-list',
  imports: [MatInput, FormsModule, NgModelDebounceChangeDirective, MatFormFieldModule, EllipsisTooltipDirective, MatTooltipModule, ItemNotFoundComponent, MatPaginatorModule, MatIconModule, MatTableModule,
    CommonModule, MatMenuModule, MatButtonModule, MatSortModule, LoadingButtonComponent, ErrorLoadingItemsComponent],
  templateUrl: './regulation-list.component.html',
  styleUrls: ['./regulation-list.component.scss'],
})
export class RegulationListComponent implements OnInit {
  currentPath: string = '';

  regulationList: any[] = [];

  searchText: string = "";

  selectedAct: number | null = null;

  requestLoading: boolean = true;

  showSearch: boolean = false;

  initialListIsEmpty: boolean = false;
  regulationFullAcess: boolean = false;

  dataSource = new MatTableDataSource<any>([]);
  private configService = inject(ConfigService);
  private apiHelperService = inject(ApiHelperService);
  hasApiError: boolean = false;
  private rolePermissionService = inject(RolePermissionService);

  constructor(private router: Router) { }
  countriesList: Array<{ id: number; name: string }> = [];

  dialogRef: MatDialogRef<any> | null = null;
  private dialog = inject(MatDialog);

  @ViewChild(MatSort) sort!: MatSort;

  sortByField: string = '';
  sortDirection: string = '';

  private snackbarService = inject(SnackbarService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private regulationsService = inject(RegulationsService)

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    this.searchText = '';
    if (!this.showSearch) {
      this.loadData(this.searchText, this.sortByField, this.sortDirection);
    } else {
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
    }
  }

  onSearchChange() {
    this.searchText =
      this.searchText.trimStart();
    this.loadData(this.searchText, this.sortByField, this.sortDirection);
  }

  clearSearch() {
    this.searchText = '';
  }

  ngOnInit() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.loadData(this.searchText, this.sortByField, this.sortDirection);
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.regulationFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  getCountriesTooltip(countries: any): string {
    if (!countries) return '-';
    if (typeof countries === 'string') {
      countries = countries.split(',').map((c: string) => c.trim());
    }

    if (!Array.isArray(countries)) {
      return String(countries);
    }

    return countries.map((c: string) => `• ${c}`).join('\n');
  }

  formatCountries(countries: any): string {
    if (!countries) return '-';
    if (Array.isArray(countries)) return countries.join(', ');
    return String(countries);
  }

  tableHeaders = [
    { columnDef: 'name', headerName: 'name', sortable: true },
    { columnDef: 'jurisdiction', headerName: 'Jurisdiction', sortable: true },
    { columnDef: 'countries', headerName: 'countries', sortable: true },
    { columnDef: 'action', headerName: 'action', sortable: true },
  ];

  sortFieldMapping: any = {
    name: 'name',
    jurisdiction: 'jurisdiction',
    countries: 'dataSubjectRegion'
  };


  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];

    this.sortByField = backendField ?? '';
    this.sortDirection = event.direction ? event.direction.toUpperCase() : '';

    this.loadData(this.searchText, this.sortByField, this.sortDirection);
  }


  displayedHeaders = this.tableHeaders.map(h => h.columnDef);

  async loadData(
    searchText: string = '',
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    try {
      this.requestLoading = true;
      this.hasApiError = false;
      const res = await this.regulationsService.getRegulationMasterList(
        false,
        {
          sortBy,
          sortDirection,
          searchText
        }
      );
      if (!res) {
        this.hasApiError = true;
        return
      }
      this.regulationList = res.acts.map((r: any) => {
        const countryNames = (r.countries || [])
          .map((country: any) => country.countryName)
          .join(', ');
        return {
          id: r.id,
          name: r.name,
          countries: countryNames,
          jurisdiction: r.jurisdiction,
          dataSubjectRegion: r.dataSubjectRegion,
          respondTime: r.respondTime,
          extensionTime: r.extensionTime,
          sla: r.sla
        };
      });

      this.dataSource = new MatTableDataSource(this.regulationList);
      if (!this.initialListIsEmpty) {
        if ((!Object.keys(searchText)?.length) && (!this.regulationList?.length)) {
          this.initialListIsEmpty = true;
        }
      }
      if (this.dataSource.data.length > 0) {
        this.requestLoading = true;
      } else {
        this.requestLoading = false;
      }
      this.dataSource.sort = this.sort;
    } catch (error) {
      console.error(error);
      this.hasApiError = true;
    }
    finally {
      this.requestLoading = false;
    }
  }

  get errorTitle() {
    return (this.searchText ? `No regulations match your search criteria`
      : `No regulations have been created yet`)
  }

  onPageChange(event: PageEvent) {
    this.loadData(this.sortByField, this.sortDirection);
  }

  onCreateRegulation() {
    const dialogRef = this.dialog.open(RegulationCreateComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      panelClass: 'dialog-wrapper',
      disableClose: true,

      data: {
        mode: 'create',
        countriesList: this.countriesList
      }
    });


    dialogRef.afterClosed().subscribe((result) => {
      if (result)
        this.loadData(this.searchText, this.sortByField, this.sortDirection);

    });
  }

  onEdit(row: any) {
    const dialogRef = this.dialog.open(RegulationCreateComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: false,
      panelClass: 'dialog-wrapper',

      data: {
        regulation: row.id
      }
    });


    dialogRef.afterClosed().subscribe((result) => {
      if (result)
        this.loadData(this.searchText, this.sortByField, this.sortDirection);
    });
  }

  goToDetails(element: any) {
    this.router.navigate([
      `${this.currentPath}/${routeConstants.REGULATION_DETAILS}`,
      element.id
    ], {
      state: { data: element }
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
        content: 'Are you sure you want to delete this regulation?',
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
        await this.configApiHelperService.deleteAct(row.id);
        await this.regulationsService.deleteRegulation(row.id)
        // await this.regulationsService.deleteRegulation(row.id)
        this.dialogRef?.close();
        this.loadData(this.searchText, this.sortByField, this.sortDirection);
      } catch (error) {
        console.error('Error deleting act:', error);
        this.snackbarService.openSnack('Failed to delete Act');
      }
    });
  }

  onCancel() {
    this.dialogRef?.close();
  }


  get isEmptyRequest() {
    return this.dataSource?.data?.length ? false : true
  }

}
