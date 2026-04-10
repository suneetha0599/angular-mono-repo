import { Component, OnInit, inject, Input, ViewChild } from '@angular/core';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { RegulationsService } from '@admin-core/services/regulations/regulations.service';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { AddRightsComponent } from '../add-rights/add-rights.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
@Component({
  selector: 'app-dssr-rights',
  standalone: true,
  imports: [
    ItemNotFoundComponent,
    MatPaginatorModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    EllipsisTooltipDirective,
    MatTooltipModule,
    FormsModule,
    MatSortModule,
  ],
  templateUrl: './dssr-rights.component.html',
  styleUrl: './dssr-rights.component.scss'
})
export class DssrRightsComponent implements OnInit {

  @Input() refreshTrigger: boolean = false;
  @Input() searchText: string = '';
  @Input() regulationId!: number;
  initialListIsEmpty: boolean = false;

  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;
  rightsList: any[] = [];
  requestLoading: boolean = true;
  showSearch: boolean = false;
  dataSource = new MatTableDataSource<any>([]);
  dialogRef: MatDialogRef<any> | null = null;
  formData = {
    actId: 0,
    provision: '',
    rightTitle: '',
    rightDescription: '',
    rightTitleSimplified: '',
    rightDescriptionSimplified: '',
    displayInForm: false
  };
  isEditMode = false;
  isViewMode = false;
  selectedId: number | null = null;
  sortByField: string = '';
  sortDirection: string = '';
  originalElements: any[] = [];

  private snackbarService = inject(SnackbarService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private regulationsService = inject(RegulationsService);
  private dialog = inject(MatDialog);

  @ViewChild('rightsDialogTemplate') rightsDialogTemplate!: TemplateRef<any>;
  @ViewChild(MatSort) sort!: MatSort;

  tableHeaders = [
    { columnDef: 'provision', headerName: 'Provision', sortable: true },
    { columnDef: 'rightTitle', headerName: 'Title', sortable: true },
    { columnDef: 'rightDescription', headerName: 'Description', sortable: true },
    { columnDef: 'rightTitleSimplified', headerName: 'Title Simplified', sortable: true },
    { columnDef: 'rightDescriptionSimplified', headerName: 'Description Simplified', sortable: true },
    { columnDef: 'action', headerName: 'action', sortable: true },
  ];

  displayedHeaders = this.tableHeaders.map(h => h.columnDef);

  constructor() { }

  ngOnInit() {
    if (this.regulationId) {
      this.loadRegulationRights();
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    this.searchText = '';
    if (!this.showSearch) {
      this.loadRegulationRights(
        this.searchText,
        this.sortByField,
        this.sortDirection
      );
    }
  }

  onSearchChange() {
    this.searchText = this.searchText.trimStart();
    this.loadRegulationRights(
      this.searchText,
      this.sortByField,
      this.sortDirection
    );
  }

  clearSearch() {
    this.searchText = '';
  }

  ngOnChanges(changes: any) {
    if (changes.searchText && this.dataSource) {
      this.applySearch(this.searchText);
    }
  }

  applySearch(value: string) {
    const filterValue = value.trim().toLowerCase();

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return (
        data.provision?.toLowerCase().includes(filter) ||
        data.rightTitle?.toLowerCase().includes(filter) ||
        data.rightDescription?.toLowerCase().includes(filter) ||
        data.rightTitleSimplified?.toLowerCase().includes(filter) ||
        data.rightDescriptionSimplified?.toLowerCase().includes(filter)
      );
    };
    this.dataSource.filter = filterValue;
  }

  formatDescriptionForTooltip(text: string): string {
    if (!text) return '';

    const normalized = text.replace(/\s+/g, ' ').trim();
    const mainPoints = normalized.split(/\s(?=\d+\.\s)/);

    if (mainPoints.length === 1) {
      return `<p>${normalized}</p>`;
    }

    let html = '<ol>';

    mainPoints.forEach(point => {
      const cleaned = point.replace(/^\d+\.\s*/, '');
      const subPoints = cleaned.split(/\s(?=[a-z]\.\s)/);

      if (subPoints.length > 1) {
        html += `<li>${subPoints[0]}<ol type="a">`;
        subPoints.slice(1).forEach(sub => {
          html += `<li>${sub.replace(/^[a-z]\.\s*/, '')}</li>`;
        });
        html += `</ol></li>`;
      } else {
        html += `<li>${cleaned}</li>`;
      }
    });

    html += '</ol>';
    return html;
  }

  async loadRegulationRights(
    search: string = '',
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    try {

      const params = {
        searchText: search,
        sortBy: sortBy,
        sortDirection: sortDirection
      };

      const res = await this.regulationsService.getRightsMasterList(
        this.regulationId,
        params
      );

      this.originalElements = res

      if (!this.initialListIsEmpty) {
        if ((!Object.keys(search)?.length) && (!this.originalElements?.length)) {
          this.initialListIsEmpty = true;
        }
      }

      this.dataSource = new MatTableDataSource(res);

      if (this.searchText) {
        this.applySearch(this.searchText);
      }

      this.dataSource.sort = this.sort;

    } catch (error) {
      console.error(error);
      this.snackbarService.openSnack('Failed to load rights');
    }
  }

  get errorTitle() {
    return (this.searchText
      ? `No data subject rights match your search criteria`
      : `No data subject rights are configured for this regulation`)
  }


  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    this.loadRegulationRights(
      this.searchText,
      this.sortByField,
      this.sortDirection
    );
  }


  sortFieldMapping: any = {
    actId: 'id',
    provision: 'displayName',
    rightTitle: 'rightTitle',
    rightDescription: 'rightDescription',
    rightTitleSimplified: 'rightTitleSimplified',
    rightDescriptionSimplified: 'rightDescriptionSimplified',
  };


  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];

    this.sortByField = backendField ?? '';
    this.sortDirection = event.direction ? event.direction.toUpperCase() : '';

    this.loadRegulationRights(
      this.searchText,
      this.sortByField,
      this.sortDirection
    );
  }

  onEdit(row: any) {
    this.isEditMode = true;
    this.selectedId = row.id;
    this.formData = {
      actId: this.regulationId,
      provision: row.provision,
      rightTitle: row.rightTitle,
      rightDescription: row.rightDescription,
      rightTitleSimplified: row.rightTitleSimplified,
      rightDescriptionSimplified: row.rightDescriptionSimplified,
      displayInForm: row.displayInForm
    };
    this.openCreateUpdateDialog();
  }

  onView(row: any) {
    console.log(row, "row");

    this.isViewMode = true;
    this.selectedId = row.id;
    this.formData = {
      actId: this.regulationId,
      provision: row.provision,
      rightTitle: row.rightTitle,
      rightDescription: row.rightDescription,
      rightTitleSimplified: row.rightTitleSimplified,
      rightDescriptionSimplified: row.rightDescriptionSimplified,
      displayInForm: row.displayInForm
    };
    this.openCreateUpdateDialog();
  }

  openCreateUpdateDialog() {
    const dialogRef = this.dialog.open(AddRightsComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        ...this.formData,
        rightId: this.selectedId,
        isEditMode: this.isEditMode,
        isViewMode: this.isViewMode,
        regulationId: this.regulationId
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadRegulationRights();
      this.isEditMode = false;
      this.isViewMode = false;
    });
  }

  resetForm(): void {
    this.formData = {
      actId: 0,
      provision: '',
      rightTitle: '',
      rightDescription: '',
      rightTitleSimplified: '',
      rightDescriptionSimplified: '',
      displayInForm: false
    };
    this.isEditMode = false;
    this.selectedId = null;
    this.dialogRef?.close();
  }

  onDelete(row: any) {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this right?',
        confirmationDetail: row.rightTitle,
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
        await this.configApiHelperService.deleteRight(row.id);
        await this.regulationsService.deleteRight(row.id);
        this.dialogRef?.close();
        this.loadRegulationRights();
      } catch (error) {
        console.error('Error deleting rights:', error);
      }
    });
  }
}
