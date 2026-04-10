import { Component, ViewChild, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { REGULATION_BPA_STAGES, RegulationBPA } from '@admin-page/data-discovery/bpa-listing/constants';
import { BpaLegalGroundComponent } from '../bpa-legal-ground/bpa-legal-ground.component';
import { RegulationLegalBasisDialogComponent } from '../../regulation-legal-basis-dialog/regulation-legal-basis-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

@Component({
  selector: 'app-regulation-bpa',
  imports: [
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatTooltipModule,
    BpaLegalGroundComponent
  ],
  templateUrl: './regulation-bpa.component.html',
  styleUrl: './regulation-bpa.component.scss'
})
export class RegulationBpaComponent implements OnInit {
  @Input() actId!: number;

  selectedTabIndex = 0;
  selectedTab: string = RegulationBPA.LEGAL_GROUND;
  RegulationBpa = RegulationBPA;
  buttonName: string = REGULATION_BPA_STAGES[this.selectedTabIndex]?.buttonName ?? '';
  tabHeaderDetails: Array<{ key: string; name: string; icon?: string }> = [];
  showLegalGroundComponent = true;
  isSearchExpanded = false;
  searchText = '';

  @ViewChild('legalGroundComponentRef') legalGroundComponentRef?: BpaLegalGroundComponent;

  private dialog = inject(MatDialog);

  constructor() { }

  ngOnInit() {
    if (this.actId) {
      this.tabHeaderDetails = REGULATION_BPA_STAGES;
    }
  }

  onTabChange(index: number) {
    const tab = REGULATION_BPA_STAGES[index];
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    this.buttonName = tab?.buttonName || '';
    this.resetSearch();
  }

  onAddButtonClick() {
    if (this.selectedTab === this.RegulationBpa.LEGAL_GROUND) {
      this.onAddLegalGroundClick();
    }
  }

  onAddLegalGroundClick() {
    const dialogRef = this.dialog.open(RegulationLegalBasisDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        actId: this.actId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success && this.legalGroundComponentRef) {
        this.legalGroundComponentRef.loadLegalBasisData(true);
      }
    });
  }

  clearSearch() {
    this.searchText = '';
    if (this.legalGroundComponentRef) {
      this.legalGroundComponentRef.onSearchQueryChange(this.searchText);
    }
  }

  onSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;

    if (!this.isSearchExpanded) {
      this.resetSearch();
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

  performSearch() {
    switch (this.selectedTab) {
      case this.RegulationBpa.LEGAL_GROUND:
        if (this.legalGroundComponentRef) {
          this.legalGroundComponentRef.onSearchQueryChange(this.searchText);
        }
        break;
    }
  }

  private resetSearch() {
    this.isSearchExpanded = false;
    this.searchText = '';
    if (this.legalGroundComponentRef) {
      this.legalGroundComponentRef.onSearchQueryChange('');
    }
  }

  public loadLegalBasisData(forceLoad: boolean = false) {
    if (this.legalGroundComponentRef) {
      this.legalGroundComponentRef.loadLegalBasisData(forceLoad);
    }
  }

  public toggleSearch(isExpanded: boolean, searchText: string): void {
    this.isSearchExpanded = isExpanded;
    this.searchText = searchText;
    if (this.legalGroundComponentRef) {
      this.legalGroundComponentRef.toggleSearch(isExpanded, searchText);
    }
  }

  public onSearchQueryChange(searchText: string): void {
    this.searchText = searchText;
    if (this.legalGroundComponentRef) {
      this.legalGroundComponentRef.onSearchQueryChange(searchText);
    }
  }
}
