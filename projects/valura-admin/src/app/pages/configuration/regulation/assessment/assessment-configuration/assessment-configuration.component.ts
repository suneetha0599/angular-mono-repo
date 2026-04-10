import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AssessmentTypesComponent } from '../assessment-types/assessment-types.component';
import { MatDialog } from '@angular/material/dialog';
import { AddAssessmentDialogComponent } from '../add-assessment-dialog/add-assessment-dialog.component';
import { TriggerPointDialogComponent } from '../trigger-point-dialog/trigger-point-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { DbService } from '@admin-core/services/db/db.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
@Component({
  selector: 'app-assessment-configuration',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    AssessmentTypesComponent,
    MatTooltipModule
  ],
  templateUrl: './assessment-configuration.component.html',
  styleUrl: './assessment-configuration.component.scss'
})
export class AssessmentConfigurationComponent {
  @ViewChild(AssessmentTypesComponent) typesComponent!: AssessmentTypesComponent;

  selectedTab: any;
  selectedTabIndex = 0;
  tabHeaderDetails: any[] = [];
  search: string = '';
  showSearch: boolean = false;

  private dbService = inject(DbService);
  private configApiHelperService = inject(ConfigApiHelperService);
  private snackbarService = inject(SnackbarService);
  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.getAssessmentTypes();
  }

  onTabChange(index: number) {
    const tabKey = this.tabHeaderDetails[index]?.name || '';
    this.selectedTabIndex = index;
    this.selectedTab = this.tabHeaderDetails[index];
    this.tabHeaderDetails = [...this.tabHeaderDetails];
  }

  onAddButtonClick() {
    if (!this.tabHeaderDetails || this.tabHeaderDetails.length === 0) {
      this.snackbarService.openSnack("Please create the assessment type!");
      return
    }

    const dialog = this.dialog.open(TriggerPointDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: null
    });

    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.typesComponent?.addTriggerPoint(result);
      }
    });
  }

  toggleSearch() {
    this.search = '';
    this.showSearch = !this.showSearch;

    if (this.showSearch) {
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
    }
  }

  clearSearch() {
    this.search = '';
  }

  onOption() {
    const dialog = this.dialog.open(AddAssessmentDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',

      data: null
    });


    dialog.afterClosed().subscribe((result) => {
      if (result) {
        if (result.success) {
          const res = {
            id: result.data.assessmentType.id,
            name: result.data.assessmentType.name
          }
          this.tabHeaderDetails.push(res);
          this.dbService.addAssessmentType(res);
        }
      }
    });
  }

  async getAssessmentTypes() {
    const assessmentType = await this.dbService.getAllAssessmentType();
    // const assessmentType = await this.configApiHelperService.getAssessmentTypes();
    this.tabHeaderDetails = [...assessmentType];
    this.selectedTab = this.tabHeaderDetails[this.selectedTabIndex];
  }

  editAssessment(tab: any) {
    const dialog = this.dialog.open(AddAssessmentDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        mode: 'edit',
        assessment: tab
      }
    });

    dialog.afterClosed().subscribe(async (result) => {
      if (!result?.success) return;
      try {
        await this.dbService.updateAssessmentType(tab.id, {
          name: result.data.name
        });
      }
      finally {
        this.getAssessmentTypes();
      }
    });
  }

  async deleteAssessment(tab: any): Promise<void> {
    const deletedIndex = this.tabHeaderDetails.findIndex(t => t.id === tab.id);
    const wasSelected = this.selectedTabIndex === deletedIndex;

    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this assessment?',
        confirmationDetail: tab.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;

      try {
        await this.configApiHelperService.onDeleteAssessment(tab.id);
        await this.dbService.deleteAssessmentType(tab.id);

        this.tabHeaderDetails = this.tabHeaderDetails.filter(t => t.id !== tab.id);

        if (wasSelected) {
          if (this.tabHeaderDetails.length === 0) {
            this.selectedTabIndex = -1;
            this.selectedTab = null;
          } else if (deletedIndex > 0) {
            this.selectedTabIndex = deletedIndex - 1;
            this.selectedTab = this.tabHeaderDetails[this.selectedTabIndex];
          } else {
            this.selectedTabIndex = 0;
            this.selectedTab = this.tabHeaderDetails[0];
          }
        } else if (deletedIndex < this.selectedTabIndex) {
          this.selectedTabIndex--;
          this.selectedTab = this.tabHeaderDetails[this.selectedTabIndex];
        }
        this.snackbarService.openSnack('Assessment deleted successfully');
      } catch (error) {
        this.snackbarService.openSnack('Failed to delete Assessment');
      } finally {
        this.getAssessmentTypes();
      }
    });
  }
}
