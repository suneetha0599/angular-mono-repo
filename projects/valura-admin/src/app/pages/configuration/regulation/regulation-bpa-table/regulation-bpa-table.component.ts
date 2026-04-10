import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { RegulationLegalBasisDialogComponent } from '../regulation-legal-basis-dialog/regulation-legal-basis-dialog.component';
import { DialogService } from '@admin-core/services/dialog.service';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { LegalBasisService } from '@admin-core/services/legalBasis/legal-basis.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface LegalGround {
  id: number;
  provision: string;
  legalGround: string;
  simplifiedDescription: string;
  name?: string;
  version?: number;
}

@Component({
  selector: 'app-regulation-bpa-table',
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
    ItemNotFoundComponent
  ],
  templateUrl: './regulation-bpa-table.component.html',
  styleUrls: ['./regulation-bpa-table.component.scss']
})
export class RegulationBpaTableComponent implements OnInit {
  private dialog = inject(MatDialog);
  private apiService = inject(ApiHelperService);
  private legalBasisService = inject(LegalBasisService);
  initialListIsEmpty: boolean = false;
  originalElements: any[] = [];

  @Input() columns: TableColumn[] = [
    { key: 'provision', label: 'Provision', sortable: true },
    { key: 'name', label: 'Legal Ground', sortable: true },
    { key: 'legalGround', label: 'Description', sortable: true }
  ];

  @Input() showTabs = false;
  @Input() emptyStateTitle = 'No legal ground configured yet';
  @Input() emptyStateMessage = 'Click "Add Legal Ground" to create your first entry';
  @Input() deleteDialogTitle = 'Delete Legal Ground';
  @Input() editDialogWidth = '350px';
  @Input() showActions = true;

  dataValues: any;

  private legalGroundsData = signal<LegalGround[]>([]);
  protected searchQuery = signal<string>('');
  protected readonly legalGrounds = this.legalGroundsData.asReadonly();
  protected readonly hasLegalGrounds = computed(() => this.legalGrounds().length > 0);

  @Input() set data(value: any[]) {
    if (value) {
      this.dataValues = value;
      this.originalElements = value;
      this.legalGroundsData.set(value);
      this.isLoading = false;
    }
  }

  get errorTitle() {
    return (this.searchText
      ? `No legal grounds match your search criteria`
      : `No legal grounds have been configured yet`)
  }

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() dataChanged = new EventEmitter<void>();

  displayedColumns: string[] = [];
  isLoading = true;
  searchText: string = "";
  selectedTab = 'REGULATION_SPECIFIC';

  private sortByFieldSignal = signal<string>('');
  private sortDirectionSignal = signal<'asc' | 'desc' | ''>('');

  shimmerDataSource: LegalGround[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    id: 0,
    provision: '',
    legalGround: '',
    simplifiedDescription: '',
    name: ''
  }));

  sortFieldMapping: any = {
    provision: 'provision',
    name: 'name',
    legalGround: 'legalGround'
  };

  ngOnInit(): void {
    this.updateDisplayedColumns();
  }

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];
    this.sortByFieldSignal.set(backendField ?? '');
    this.sortDirectionSignal.set(event.direction ? event.direction as 'asc' | 'desc' : '');
  }

  protected readonly filteredLegalGrounds = computed(() => {
    let legalGrounds = this.legalGroundsData();
    const sortField = this.sortByFieldSignal();
    const sortDir = this.sortDirectionSignal();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      legalGrounds = legalGrounds.filter(legalGround =>
        legalGround.provision?.toLowerCase().includes(query) ||
        legalGround.name?.toLowerCase().includes(query) ||
        legalGround.legalGround?.toLowerCase().includes(query)
      );
    }

    if (sortField && sortDir) {
      legalGrounds = [...legalGrounds].sort((a: any, b: any) => {
        const aValue = (a[sortField] ?? '').toString().toLowerCase();
        const bValue = (b[sortField] ?? '').toString().toLowerCase();

        if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return legalGrounds;
  });

  protected readonly hasFilteredResults = computed(() => this.filteredLegalGrounds().length > 0);

  protected openLegalBasisDetails(legalBasisId: number): void {
    this.dialog.open(RegulationLegalBasisDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: false,
      panelClass: 'dialog-wrapper',

      data: {
        legalBasisId: legalBasisId
      }
    });

  }

  private updateDisplayedColumns(): void {
    const dynamicCols = this.columns.map(c => c.key);
    this.displayedColumns = [...dynamicCols];
    if (this.showActions) {
      this.displayedColumns.push('actions');
    }
  }

  public filterLegalGrounds(searchTerm: string): void {
    this.searchQuery.set(searchTerm);
    this.searchText = searchTerm;
  }

  public onSearchChange(value: string): void {
    this.filterLegalGrounds(value);
  }

  protected getColumnValue(item: any, columnKey: string): any {
    return item[columnKey];
  }

  onIconHover(event: MouseEvent, color: string): void {
    const target = event.target as HTMLElement;
    if (target) target.style.color = color;
  }

  protected async onEdit(item: LegalGround): Promise<void> {
    if (this.edit.observed) {
      this.edit.emit(item);
      return;
    }

    const dialogRef = this.dialog.open(RegulationLegalBasisDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        legalBasisId: item.id,
        forceEditMode: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataChanged.emit();
      }
    });
  }

  protected onDelete(item: LegalGround): void {
    if (this.delete.observed) {
      this.delete.emit(item);
      return;
    }

    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this legal ground?',
        confirmationDetail: item.name,
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
      if (confirmed) {
        try {
          await this.apiService.deleteLegalBasis(item.id);
          await this.legalBasisService.deleteLegalBasis(item.id);
          this.dataChanged.emit();
        } catch (err) {
          console.error('Delete failed', err);
        }
      }
    });
  }

  public onTabChange(event: any): void {
    this.selectedTab = event.value;
    this.tabChange.emit(event.value);
  }
}
