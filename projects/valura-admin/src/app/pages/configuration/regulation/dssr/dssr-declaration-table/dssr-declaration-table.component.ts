import { Component, signal, computed, inject, Input, Output, EventEmitter, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { routes as routeConstants } from '@admin-core/constants/routes';
import { DssrDeclarationDialogComponent } from '../dssr-declaration-dialog/dssr-declaration-dialog.component';
import { EllipsisTooltipDirective } from 'app/directives/ellipsis-tooltip.directive';
import { Declaration } from '@admin-core/models/configuration/regulation';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { effect } from '@angular/core';
import { DeclarationService } from '@admin-core/services/declaration/declaration.service';

import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
export interface DeclarationTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-dssr-declaration-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatMenuModule,
    EllipsisTooltipDirective,
    MatProgressSpinnerModule,
    MatDialogModule,
    ItemNotFoundComponent
  ],
  templateUrl: './dssr-declaration-table.component.html',
  styleUrls: ['./dssr-declaration-table.component.scss']
})
export class DssrDeclarationTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  declarationDatas: any;
  @Input() showTabs: boolean = false;
  @Input() set data(value: Declaration[]) {
    if (value) {
      this.declarationsData.set(value);
      this.allDeclarations.set([...value]);
      this.declarationDatas = value;
      this.dataLoaded = true;
      this.isLoading = false;
    }
  }
  initialListIsEmpty: boolean = false;

  @Input() emptyStateTitle: string = 'No declarations configured yet';
  @Input() emptyStateMessage: string = 'Click "Add Declaration" to create your first declaration';
  @Input() deleteDialogTitle: string = 'Delete Declaration';
  @Input() showActions: boolean = true;

  @Output() edit = new EventEmitter<Declaration>();
  @Output() delete = new EventEmitter<Declaration>();
  @Output() tabChange = new EventEmitter<string>();
  private dialog = inject(MatDialog);
  searchText: string = "";

  private declarationService = inject(DeclarationService);

  @Input() regulationId!: number;

  private declarationsData = signal<Declaration[]>([]);
  private allDeclarations = signal<Declaration[]>([]);
  protected searchQuery = signal<string>('');
  protected readonly declarations = this.declarationsData.asReadonly();
  selectedTab: string = 'REGULATION_SPECIFIC';
  dataLoaded = false;
  mainDispayedColumns: string[] = ['declaration', 'rightTitle', 'actions'];
  displayedColumns: string[] = []
  isLoading: boolean = true;

  private sortByFieldSignal = signal<string>('');
  private sortDirectionSignal = signal<'asc' | 'desc' | ''>('');

  shimmerDataSource: Declaration[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    id: 0,
    declaration: '',
    type: 'REGULATION_SPECIFIC' as 'REGULATION_SPECIFIC',
    entityType: 'REGULATION' as 'REGULATION',
    entityId: 0,
    clientOverride: { overriddenDeclaration: '' },
    displayInForm: false
  }));

  get errorTitle() {
    this.loadDeclarationsForTab();
    return (this.searchText
      ? `No declarations match your search criteria`
      : `No declarations have been configured for this regulation`)
  }

  originalElements: any[] = [];

  public async loadDeclarationsForTab() {
    try {
      const res = await this.declarationService.getDeclarationsByActId(this.regulationId);
      this.originalElements = res;
      if (this.originalElements.length > 0) {
        this.showTabs = true;
      } else {
        this.initialListIsEmpty = true;
        this.showTabs = false;
      }
    } catch (error) {
      console.error('Error loading declarations:', error);
    }
  }

  private router = inject(Router);

  private isRefreshing = false;

  constructor() {
    effect(() => {
      this.declarationsData();
      this.allDeclarations();

      if (!this.isRefreshing) {
        this.refreshDeclarations();
      }
    });
  }

  private async refreshDeclarations() {
    this.isRefreshing = true;
    await this.loadDeclarationsForTab();
    this.isRefreshing = false;
  }

  ngOnInit() {
    this.setTableHeaders()
    this.loadDeclarationsForTab()
  }

  ngAfterViewInit() {
  }

  sortFieldMapping: any = {
    declaration: 'declaration',
    entityType: 'entityType',
    rightTitle: 'rightTitle'
  };

  onSortChange(event: Sort) {
    const backendField = this.sortFieldMapping[event.active];
    this.sortByFieldSignal.set(backendField ?? '');
    this.sortDirectionSignal.set(event.direction ? event.direction as 'asc' | 'desc' : '');
  }

  protected readonly filteredDeclarations = computed(() => {
    let declarations = this.declarationsData();
    const sortField = this.sortByFieldSignal();
    const sortDir = this.sortDirectionSignal();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      declarations = declarations.filter(declaration =>
        declaration.declaration?.toLowerCase().includes(query) ||
        declaration.entityType?.toLowerCase().includes(query) ||
        declaration.type?.toLowerCase().includes(query)
      );
    }

    if (sortField && sortDir) {
      declarations = [...declarations].sort((a: any, b: any) => {
        const aValue = (a[sortField] ?? '').toString().toLowerCase();
        const bValue = (b[sortField] ?? '').toString().toLowerCase();

        if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return declarations;
  });

  protected readonly hasFilteredResults = computed(() => this.filteredDeclarations().length > 0);

  public filterDeclarations(searchTerm: string): void {
    this.searchText = searchTerm;
    this.searchQuery.set(searchTerm);
  }

  public onSearchChange(value: string): void {
    this.filterDeclarations(value);
  }

  public onTabChange(event: any): void {
    this.selectedTab = event.value;
    this.applyTabFilter();
    this.setTableHeaders();
    this.tabChange.emit(this.selectedTab);
  }

  private applyTabFilter(): void {
    if (this.rightSpecificTab) {
      this.declarationsData.set(
        this.allDeclarations().filter(d => d.type === 'RIGHT_SPECIFIC')
      );
    } else {
      this.declarationsData.set(
        this.allDeclarations().filter(d => d.type === 'REGULATION_SPECIFIC')
      );
    }
  }

  public switchTab(tab: string): void {
    this.selectedTab = tab;
    this.setTableHeaders()
    this.tabChange.emit(tab);
  }

  protected onEdit(declaration: Declaration): void {
    const dialog = this.dialog.open(DssrDeclarationDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        declarationId: declaration.id,
        regulationId: this.regulationId,
        editMode: true
      }
    });

    dialog.afterClosed().subscribe(async (result) => {
      if (result) {
        if (result.success) {
          this.setTableHeaders()
          this.tabChange.emit(this.selectedTab);
        }
      }
    });
  }

  protected onDelete(declaration: Declaration): void {
    this.delete.emit(declaration);
  }
  onIconHover(event: MouseEvent, color: string): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.color = color;
    }
  }
  public addDeclaration(declaration: Declaration): void {
    this.declarationsData.update(declarations => [...declarations, declaration]);
    this.allDeclarations.update(declarations => [...declarations, declaration]);
  }

  public updateDeclaration(id: number, updates: Partial<Declaration>): void {
    this.declarationsData.update(declarations =>
      declarations.map(declaration =>
        declaration.id === id ? { ...declaration, ...updates } : declaration
      )
    );
    this.allDeclarations.update(declarations =>
      declarations.map(declaration =>
        declaration.id === id ? { ...declaration, ...updates } : declaration
      )
    );
  }

  public removeDeclaration(id: number): void {
    this.declarationsData.update(declarations =>
      declarations.filter(declaration => declaration.id !== id)
    );
    this.allDeclarations.update(declarations =>
      declarations.filter(declaration => declaration.id !== id)
    );
  }

  protected openDeclarationDetails(declarationId: number): void {
    this.dialog.open(DssrDeclarationDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: false,
      panelClass: 'dialog-wrapper',

      data: {
        declarationId,
        regulationId: this.regulationId,
        viewMode: false
      }
    });

  }

  setTableHeaders() {
    this.displayedColumns = this.rightSpecificTab ? this.mainDispayedColumns : this.mainDispayedColumns.filter(c => c !== 'rightTitle');
  }

  get rightSpecificTab() {
    return this.selectedTab === 'RIGHT_SPECIFIC'
  }
}
