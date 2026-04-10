import { Component, signal, inject, ViewChild, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DssrDeclarationTableComponent } from '../dssr-declaration-table/dssr-declaration-table.component';
import { DialogService } from '@admin-core/services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { DssrDeclarationDialogComponent } from '../dssr-declaration-dialog/dssr-declaration-dialog.component';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { DeclarationService } from '@admin-core/services/declaration/declaration.service';
import { Declaration } from '@admin-core/models/configuration/regulation';
import { DbService } from '@admin-core/services/db/db.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ConfigurationService } from '@admin-core/services/configuration.service';

@Component({
  selector: 'app-dssr-declaration',
  imports: [CommonModule, DssrDeclarationTableComponent],
  templateUrl: './dssr-declaration.component.html',
  styleUrl: './dssr-declaration.component.scss'
})
export class DssrDeclarationComponent implements OnInit, OnChanges {
  private dialogService = inject(DialogService);
  private dialog = inject(MatDialog);
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private declarationService = inject(DeclarationService);
  private dbService = inject(DbService);
  private configurationService = inject(ConfigurationService);

  @Input() regulationId!: number;
  @Input() searchText: string = '';
  @ViewChild(DssrDeclarationTableComponent) tableComponent?: DssrDeclarationTableComponent;

  protected emptyStateTitle = 'No declarations configured yet';
  protected emptyStateMessage = 'Click "Add Declaration" to create your first declaration';
  protected deleteDialogTitle = 'Delete Declaration';
  protected showTabs = false;
  public activeTabType: 'REGULATION_SPECIFIC' | 'RIGHT_SPECIFIC' = 'REGULATION_SPECIFIC';

  private declarationsData = signal<Declaration[]>([]);
  protected readonly declarations = this.declarationsData.asReadonly();

  private rights: any[] = [];

  async ngOnInit() {
    if (this.regulationId) {
      await this.getRights();
      await this.loadDeclarationsForTab(this.activeTabType);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText'] && this.tableComponent) {
      this.filterDeclarations(this.searchText);
    }
  }


  private async getRights(): Promise<void> {
    try {

      const rightsList = await this.dbService.getRightsByActId(this.regulationId);
      this.rights = rightsList || [];
    } catch (err) {
      console.error('Error fetching rights:', err);
      this.rights = [];
    }
  }

  public async loadDeclarationsForTab(tabType: 'REGULATION_SPECIFIC' | 'RIGHT_SPECIFIC', forceLoad: boolean = false) {
    try {
      const entityType = tabType === 'REGULATION_SPECIFIC' ? 'REGULATION' : 'RIGHT';
      let declarations: Declaration[] = [];

      if (forceLoad) {
        const entityId = tabType === 'REGULATION_SPECIFIC' ? this.regulationId : 0;
        const response = await this.apiHelperService.getDeclarationsByEntity({
          specificType: tabType,
          entityType,
          entityId,
          actId: this.regulationId
        });

        declarations = response?.generalDeclaration || [];

        if (declarations.length > 0) {
          await this.declarationService.addBulkDeclarations(declarations);
        }
      } else {
        declarations = await this.declarationService.getDeclarationsByEntity(entityType, this.regulationId);
      }

      this.declarationsData.set(declarations);
    } catch (error) {
      console.error('Error loading declarations:', error);
      this.snackbarService.openSnack('Failed to load declarations');
    }
  }

  public async onTabSwitch(tabType: string) {
    this.activeTabType = tabType as 'REGULATION_SPECIFIC' | 'RIGHT_SPECIFIC';
    this.configurationService.onEntityTypeChange$.next(tabType)
    await this.loadDeclarationsForTab(this.activeTabType);
  }

  public filterDeclarations(searchTerm: string): void {
    if (this.tableComponent) {
      this.tableComponent.filterDeclarations(searchTerm);
    }
  }

  public addDeclaration(declaration: Declaration): void {
    this.declarationsData.update(declarations => [...declarations, declaration]);
    if (this.tableComponent) {
      this.tableComponent.addDeclaration(declaration);
    }
  }

  public updateDeclaration(id: number, updates: Partial<Declaration>): void {
    this.declarationsData.update(declarations =>
      declarations.map(declaration =>
        declaration.id === id ? { ...declaration, ...updates } : declaration
      )
    );
    if (this.tableComponent) {
      this.tableComponent.updateDeclaration(id, updates);
    }
  }

  public deleteDeclaration(id: number): void {
    this.declarationsData.update(declarations =>
      declarations.filter(declaration => declaration.id !== id)
    );
    if (this.tableComponent) {
      this.tableComponent.removeDeclaration(id);
    }
  }

  protected onEdit(declaration: any): void {
    const dialogRef = this.dialog.open(DssrDeclarationDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        declarationId: declaration.id,
        regulationId: this.regulationId
      }
    });


    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        if (result.success) {
          await this.loadDeclarationsForTab(this.activeTabType);
        }
      }
    });
  }

  protected onDelete(declaration: any): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this declaration?',
        confirmationDetail: declaration.declaration,
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
          await this.apiHelperService.deleteDeclaration(declaration.id);
          await this.declarationService.deleteDeclaration(declaration.id);
          await this.loadDeclarationsForTab(this.activeTabType);
        } catch (error) {
          console.error('Error deleting declaration:', error);
        }
      }
    });
  }
}
