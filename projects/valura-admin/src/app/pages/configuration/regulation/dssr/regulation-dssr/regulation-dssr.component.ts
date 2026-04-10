import { Component, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { REGULATION_DSSR_STAGES, RegulationDSSR } from '@admin-page/data-discovery/bpa-listing/constants';
import { DssrRightsComponent } from '../dssr-rights/dssr-rights.component';
import { DssrValidationQuestionComponent } from '../dssr-validation-question/dssr-validation-question.component';
import { DssrDeclarationComponent } from '../dssr-declaration/dssr-declaration.component';
import { DssrDeclarationDialogComponent } from '../dssr-declaration-dialog/dssr-declaration-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Input } from '@angular/core';
import { AddValidationQuestionDialogComponent } from '../add-validation-question-dialog/add-validation-question-dialog.component';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ActivatedRoute } from '@angular/router';
import { AddRightsComponent } from '../add-rights/add-rights.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ConfigurationService } from '@admin-core/services/configuration.service';
import { Subscription } from 'rxjs';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';

@Component({
  selector: 'app-regulation-dssr',
  imports: [
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    DssrRightsComponent,
    DssrValidationQuestionComponent,
    DssrDeclarationComponent,
    DssrRightsComponent,
    DssrValidationQuestionComponent,
    DssrDeclarationComponent,
    FormsModule,
    LoadingButtonComponent
  ],
  templateUrl: './regulation-dssr.component.html',
  styleUrl: './regulation-dssr.component.scss'
})

export class RegulationDssrComponent implements AfterViewInit {
  @Input() regulationId!: number;

  selectedTabIndex = 0;
  selectedTab: string = RegulationDSSR.RIGHTS;
  RegulationDssr = RegulationDSSR;
  buttonName: string = REGULATION_DSSR_STAGES[this.selectedTabIndex]?.buttonName ?? '';
  tabHeaderDetails: Array<{ key: string; name: string; icon?: string }> = [];
  search: string = '';
  showSearch: boolean = false;
  showRightsComponent = true;
  isSearchExpanded = false;
  searchText = '';
  rightsUpdated = false;
  refreshValidationQuestion: boolean = false;
  entityChangeSubscription!: Subscription;
  selectedEntityType: string = '';

  @ViewChild('declarationComponentRef') declarationComponentRef?: DssrDeclarationComponent;
  @ViewChild(DssrRightsComponent) rightsComponent!: DssrRightsComponent;
  @ViewChild(DssrValidationQuestionComponent) validationQuestionComponent!: DssrValidationQuestionComponent;

  private configurationService = inject(ConfigurationService);

  constructor(private dialog: MatDialog, private httpService: HttpService, private snackbarService: SnackbarService, private route: ActivatedRoute) { }

  ngOnInit() {
    if (this.regulationId) {
      this.tabHeaderDetails = REGULATION_DSSR_STAGES;
      this.handleQueryParams();
    }
    this.entityChangeSubscription = this.configurationService.onEntityTypeChange$.subscribe(type => {
      if (type) {
        this.selectedEntityType = type
      }
    });
  }

  ngOnDestroy(): void {
    this.entityChangeSubscription?.unsubscribe();
  }

  private handleQueryParams() {
    const subTab = this.route.snapshot.queryParamMap.get('subTab');
    if (subTab === 'declaration') {
      this.selectedTabIndex = 2;
      this.selectedTab = RegulationDSSR.DECLARATION;
      this.buttonName = REGULATION_DSSR_STAGES[2]?.buttonName ?? '';
    }
  }

  ngAfterViewInit() {
  }

  onTabChange(index: number) {
    const tab = REGULATION_DSSR_STAGES[index];
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTab = tabKey;
    this.buttonName = tab?.buttonName || '';
    this.search = '';
    this.resetSearch();
  }

  onAddButtonClick() {
    if (this.selectedTab === this.RegulationDssr.RIGHTS) {
      this.onAddRightClick()
    }
    else if (this.selectedTab === this.RegulationDssr.VALIDATION_QUESTION) {
      this.onAddValidationQuestionClick()
    }
    else if (this.selectedTab === this.RegulationDssr.DECLARATION) {
      this.onAddDeclarationClick()
    }
  }

  onAddDeclarationClick() {
    const dialogRef = this.dialog.open(DssrDeclarationDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        editMode: true,
        regulationId: this.regulationId,
        selectedEntityType: this.selectedEntityType
      }
    });


    dialogRef.afterClosed().subscribe(async result => {
      if (result?.success && this.declarationComponentRef) {
        await this.declarationComponentRef.loadDeclarationsForTab(this.declarationComponentRef.activeTabType);
      }
    });
  }

  onAddValidationQuestionClick() {
    if (this.selectedTab === this.RegulationDssr.VALIDATION_QUESTION) {
      const dialog = this.dialog.open(AddValidationQuestionDialogComponent, {
        ...GLOBAL_DIALOG_DEFAULTS,

        disableClose: true,
        panelClass: 'dialog-wrapper',

        data: {
          regulationId: this.regulationId,
          editMode: false,
          selectedEntityType: this.selectedEntityType
        }
      });


      dialog.afterClosed().subscribe(res => {
        if (res?.success) {
          this.refreshValidationQuestion = !this.refreshValidationQuestion;
        }
      });
    }
  }

  onAddRightClick() {
    if (this.selectedTab === this.RegulationDssr.RIGHTS) {
      const dialogRef = this.dialog.open(AddRightsComponent, {
        ...GLOBAL_DIALOG_DEFAULTS,

        disableClose: true,
        panelClass: 'dialog-wrapper',

        data: {
          regulationId: this.regulationId
        }
      });


      dialogRef.afterClosed().subscribe(res => {
        this.refreshValidationQuestion = true;
        this.rightsComponent?.loadRegulationRights();
      }
      )
    }
  }

  toggleSearch() {
    this.search = '';
    this.showSearch = !this.showSearch;
  }

  clearSearch() {
    this.searchText = '';
    this.rightsComponent.loadRegulationRights(
      this.searchText,
      this.rightsComponent.sortByField,
      this.rightsComponent.sortDirection
    );
  }

  onSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;

    if (!this.isSearchExpanded) {
      this.resetSearch();
      this.rightsComponent.loadRegulationRights(
        this.searchText,
        this.rightsComponent.sortByField,
        this.rightsComponent.sortDirection
      );
    } else {
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }, 100);
    }

    if (this.declarationComponentRef) {
      this.declarationComponentRef.filterDeclarations(this.searchText);
    }
  }

  performSearch() {
    switch (this.selectedTab) {

      case this.RegulationDssr.RIGHTS:
        if (this.rightsComponent) {
          this.rightsComponent.loadRegulationRights(
            this.searchText,
            this.rightsComponent.sortByField,
            this.rightsComponent.sortDirection
          );
        }
        break;

      case this.RegulationDssr.VALIDATION_QUESTION:
        if (this.declarationComponentRef) {
          this.declarationComponentRef.filterDeclarations(this.searchText);
        }
        break;

      case this.RegulationDssr.DECLARATION:
        if (this.declarationComponentRef) {
          this.declarationComponentRef.filterDeclarations(this.searchText);
        }
        break;
    }
  }


  private resetSearch() {
    this.isSearchExpanded = false;
    this.searchText = '';

    this.declarationComponentRef?.filterDeclarations('');
    this.validationQuestionComponent?.applyFilter();
  }
}
