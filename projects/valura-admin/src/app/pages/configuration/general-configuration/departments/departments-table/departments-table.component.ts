import { Component, signal, computed, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { DialogService } from '@admin-core/services/dialog.service';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width: string
}

export interface Department {
  id: number;
  name: string;
  description: string;
  version?: number;
}

@Component({
  selector: 'app-departments-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    FormsModule,
    EllipsisTooltipDirective,
    ItemNotFoundComponent,
    ErrorLoadingItemsComponent
  ],
  templateUrl: './departments-table.component.html',
  styleUrls: ['./departments-table.component.scss']
})
export class DepartmentsTableComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  private dialog = inject(MatDialog);
  originalElements: any[] = [];
  private dialogService = inject(DialogService);
  private apiService = inject(ApiHelperService);
  private rolePermissionService = inject(RolePermissionService);
  departmentFullAcess: boolean = false;

  @Input() columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true, width: '20%' },
    { key: 'description', label: 'Description', sortable: true, width: '70%' },
  ];
  @Input() showTabs: boolean = false;
  @Input() searchTerm: string = '';
  @Input() set data(value: any[]) {
    if (value) {
      this.departmentsData.set(value);
      this.allDepartments.set([...value]);
      this.originalElements = value;
      this.dataLoaded = true;
      this.isLoading = false;
      this.updateDisplayedColumns();
    }
  }

  @Input() emptyStateTitle: string = 'No departments configured yet';
  @Input() emptyStateMessage: string = 'Click "Add department" to create your first entry';
  @Input() deleteDialogTitle: string = 'Delete Department';
  @Input() editDialogComponent: any;
  @Input() hasApiError: boolean = false;
  @Input() requestLoading: boolean = true;
  @Input() initialListIsEmpty: boolean = false;
  @Input() editDialogWidth: string = '350px';
  @Input() showActions: boolean = true;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() dataChanged = new EventEmitter<void>();


  get errorTitle() {
    return (this.searchTerm
      ? `No departments match your search criteria`
      : `No departments have been created yet`)
  }

  private departmentsData = signal<any[]>([]);
  private allDepartments = signal<any[]>([]);
  protected searchQuery = signal<string>('');
  protected readonly departments = this.departmentsData.asReadonly();
  protected readonly hasDepartments = computed(() => this.departments().length > 0);

  private sortByFieldSignal = signal<string>('');
  private sortDirectionSignal = signal<'asc' | 'desc' | ''>('');

  private dataLoaded = false;
  displayedColumns: string[] = [];
  isLoading: boolean = true;
  selectedTab: string = 'DEPARTMENT_SPECIFIC';

  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    id: 0,
    name: '',
    description: '',
    version: 0
  }));

  get isEmptyRequest(): boolean {
    return !this.isLoading && this.allDepartments().length === 0;
  }

  constructor() { }

  ngOnInit() {
    this.updateDisplayedColumns();
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.departmentFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  ngAfterViewInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTerm'] && changes['searchTerm'].currentValue !== undefined) {
      this.searchQuery.set(changes['searchTerm'].currentValue || '');
    }
  }

  sortFieldMapping: any = {
    name: 'name',
    description: 'description'
  };

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];
    this.sortByFieldSignal.set(backendField ?? '');
    this.sortDirectionSignal.set(event.direction ? event.direction as 'asc' | 'desc' : '');
  }

  private updateDisplayedColumns(): void {
    const columnKeys = this.columns.map(col => col.key);
    this.displayedColumns = [...columnKeys, ...(this.showActions ? ['actions'] : [])];
  }

  protected readonly filteredDepartments = computed(() => {
    let depts = this.departmentsData();
    const sortField = this.sortByFieldSignal();
    const sortDir = this.sortDirectionSignal();
    const query = this.searchQuery().toLowerCase().trim();

    // Filter by search query
    if (query) {
      depts = depts.filter(dept =>
        this.columns.some(col => {
          const value = (dept as any)[col.key];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (sortField && sortDir) {
      depts = [...depts].sort((a: any, b: any) => {
        const aValue = (a[sortField] ?? '').toString().toLowerCase();
        const bValue = (b[sortField] ?? '').toString().toLowerCase();

        if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return depts;
  });

  protected readonly hasFilteredResults = computed(() => this.filteredDepartments().length > 0);

  public filterDepartments(searchTerm: string): void {
    this.searchQuery.set(searchTerm);
  }

  public onSearchChange(value: string): void {
    this.filterDepartments(value);
  }

  protected getColumnValue(item: any, columnKey: string): any {
    return item[columnKey];
  }

  protected onView(department: Department): void {
    if (this.view.observed) {
      this.view.emit(department);
    }
  }

  protected onEdit(department: Department): void {
    if (this.edit.observed) {
      this.edit.emit(department);
      return;
    }
    if (!this.editDialogComponent) {
      console.warn('No edit dialog component provided');
      return;
    }
    const dialogRef = this.dialog.open(this.editDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      width: this.editDialogWidth,
      data: {
        editMode: true,
        departmentId: department.id,
        itemData: {
          id: department.id,
          name: department.name,
          description: department.description,
          version: department.version
        }
      },
      panelClass: 'dialog-wrapper',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.dataChanged.emit();
      }
    });
  }

  protected async onDelete(department: Department): Promise<void> {
    if (this.delete.observed) {
      this.delete.emit(department);
      return;
    }
    const firstColumnValue = this.getColumnValue(department, this.columns[0].key);
    const secondColumnValue = this.columns.length > 1 ? this.getColumnValue(department, this.columns[1].key) : '';
    const itemDescription = secondColumnValue ? `${firstColumnValue} - ${secondColumnValue}` : firstColumnValue;
    this.dialogService.openConfirmDialog({
      title: this.deleteDialogTitle,
      message: `Are you sure you want to delete "${itemDescription}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      width: '500px'
    }).subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          this.dataChanged.emit();
        } catch (error) {
          console.error('Error deleting department:', error);
        }
      }
    });
  }

  onIconHover(event: MouseEvent, color: string): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.color = color;
    }
  }

  public addDepartment(department: Department): void {
    this.departmentsData.update(depts => [...depts, department]);
    this.allDepartments.update(depts => [...depts, department]);
  }

  public onTabChange(event: any): void {
    const tab = event.value;
    this.selectedTab = tab;
    this.tabChange.emit(tab);
  }
}
