import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DataInventoryDialogComponent } from './data-inventory-dialog/data-inventory-dialog.component';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { DataSubjectService } from '@admin-core/services/dataSubject/data-subject.service';
import { CategoryService } from '@admin-core/services/category/category.service';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

interface DataSubject {
  id: number;
  name: string;
  description: string;
}

interface PDCategory {
  id: number;
  name: string;
}

interface TableHeader {
  columnDef: string;
  headerName: string;
  key: string;
  sortable: boolean;
}

@Component({
  selector: 'app-data-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    EllipsisTooltipDirective
  ],
  templateUrl: './data-inventory.component.html',
  styleUrl: './data-inventory.component.scss'
})
export class DataInventoryComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private apiHelperService = inject(ApiHelperService);
  private configApiHelperService = inject(ConfigApiHelperService);

  private router = inject(Router);
  private datasubjectService = inject(DataSubjectService);
  private pdCategoryService = inject(CategoryService);

  currentPath: string = '';

  pageTitle = 'Data Inventory';

  selectedTabIndex = 0;
  isLoading: boolean = true;

  dataSource = new MatTableDataSource<any>([]);

  categories = [
    { label: 'Data Subjects', value: 'dataSubjects' },
    { label: 'Categories', value: 'categories' }
  ];
  constructor(private dialog: MatDialog) { }


  HEADER_ID = 'id';
  HEADER_NAME = 'name';
  HEADER_DESCRIPTION = 'description';
  HEADER_SENSITIVITY = 'sensitivity';
  HEADER_ACTIONS = 'actions';



  dataSubjectsHeaders: TableHeader[] = [
    { columnDef: 'id', headerName: 'ID', key: this.HEADER_ID, sortable: true },
    { columnDef: 'name', headerName: 'Name', key: this.HEADER_NAME, sortable: true },
    { columnDef: 'description', headerName: 'Description', key: this.HEADER_DESCRIPTION, sortable: true },
    { columnDef: 'actions', headerName: 'Actions', key: this.HEADER_ACTIONS, sortable: false }
  ];

  categoriesHeaders: TableHeader[] = [
    { columnDef: 'id', headerName: 'ID', key: this.HEADER_ID, sortable: true },
    { columnDef: 'name', headerName: 'Name', key: this.HEADER_NAME, sortable: true },
    { columnDef: 'sensitivity', headerName: 'Sensitivity', key: this.HEADER_SENSITIVITY, sortable: true },
    { columnDef: 'actions', headerName: 'Actions', key: this.HEADER_ACTIONS, sortable: false }
  ];

  tableHeaders: TableHeader[] = [];
  displayedColumns: string[] = [];

  dataSubjects: DataSubject[] = [];
  pdCategories: PDCategory[] = [];


  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    id: '',
    name: '',
    description: '',
    sensitivity: ''
  }));

  ngOnInit(): void {
    this.loadDataForCurrentTab();
    this.onInitPage();
  }
  onInitPage(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  getTabSpecificButtonText(): string {
    return this.selectedTabIndex === 0 ? 'Add Data Subject' : 'Add Category';
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadDataForCurrentTab(): Promise<void> {
    this.isLoading = true;

    try {
      if (this.selectedTabIndex === 0) {

        this.tableHeaders = this.dataSubjectsHeaders;
        this.displayedColumns = this.dataSubjectsHeaders.map(h => h.columnDef);
        await this.loadDataSubjects();
      } else {

        this.tableHeaders = this.categoriesHeaders;
        this.displayedColumns = this.categoriesHeaders.map(h => h.columnDef);
        await this.loadCategories();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {

      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    }
  }

  async loadDataSubjects(): Promise<void> {
    try {
      const response = await this.datasubjectService.getDatasubjectMasterList();
      if (response) {
        this.dataSubjects = response;
        this.dataSource.data = this.dataSubjects;
      } else {
        this.dataSource.data = [];
      }
    } catch (error) {
      console.error('Error loading data subjects:', error);
      this.dataSource.data = [];
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const response = await this.pdCategoryService.getPdCategoryMasterList();
      if (response) {
        this.pdCategories = response;
        this.dataSource.data = this.pdCategories;
      } else {
        this.dataSource.data = [];
      }
    } catch (error) {
      console.error('Error loading PD categories:', error);
      this.dataSource.data = [];
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.loadDataForCurrentTab();
  }

  getSensitivityClass(sensitivity: string): string {
    const lowerSensitivity = sensitivity?.toLowerCase() || '';
    switch (lowerSensitivity) {
      case 'high':
        return 'high-sensitivity';
      case 'medium':
        return 'medium-sensitivity';
      case 'low':
        return 'low-sensitivity';
      default:
        return 'default-sensitivity';
    }
  }

  getSensitivityLabel(sensitivity: string): string {
    return sensitivity ? sensitivity.charAt(0).toUpperCase() + sensitivity.slice(1) : 'Not Set';
  }

  create(): void {
    const dialogType = this.selectedTabIndex === 0 ? 'dataSubject' : 'category';

    const dialogRef = this.dialog.open(DataInventoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: { dialogType },
      disableClose: true,
      panelClass: 'dialog-wrapper'
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {

        this.loadDataForCurrentTab();
      }
    });
  }



  viewCategoryDetails(category: PDCategory): void {
    this.router.navigate([`${this.currentPath}/category-details/${category.id}`], {
      state: { category }
    });
  }

  deleteRow(row: any): void {
    const isDataSubject = this.selectedTabIndex === 0;
    const itemType = isDataSubject ? 'Data Subject' : 'Category';

    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        type: 'confirmation',
        title: `Delete ${itemType}`,
        content: `Are you sure you want to delete this ${itemType.toLowerCase()}?`,
        confirmationDetail: row.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning',
        iconColor: 'text-red-600'
      },
      panelClass: 'dialog-wrapper'
    });


    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.performDelete(row.id, isDataSubject);
      }
    });
  }
  async performDelete(id: number, isDataSubject: boolean): Promise<void> {
    try {
      if (isDataSubject) {
        await this.configApiHelperService.deleteDataSubject(id);
        await this.datasubjectService.deletDataSubject(id);
      } else {
        await this.configApiHelperService.deletePdCategory(id);
        await this.pdCategoryService.deletPdCategory(id);
      }

      await this.loadDataForCurrentTab();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }

  editRow(row: any): void {
    const dialogType = this.selectedTabIndex === 0 ? 'dataSubject' : 'category';

    const dialogRef = this.dialog.open(DataInventoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType,
        editMode: true,
        itemData: row
      },
      disableClose: true,
      panelClass: 'dialog-wrapper'
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadDataForCurrentTab();
      }
    });
  }
}
