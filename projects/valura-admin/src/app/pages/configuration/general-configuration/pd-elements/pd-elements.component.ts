import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CategoryComponent } from '../category/category.component';
import { DataElementComponent } from '../data-element/data-element.component';
import { ClassificationComponent } from '../classification/classification.component';
import { AddPdElementsDialogComponent } from '../add-pd-elements-dialog/add-pd-elements-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { inject } from '@angular/core';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
type TabKey = 'dataElements' | 'category' | 'classification';

@Component({
  selector: 'app-pd-elements',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    DataElementComponent,
    ClassificationComponent,
    CategoryComponent,
    MatFormFieldModule,
    MatIconModule,
    LoadingButtonComponent,
    FormsModule,
    MatInputModule,
    MatMenuModule
  ],
  templateUrl: './pd-elements.component.html',
  styleUrls: ['./pd-elements.component.scss'],
})
export class PdElementsComponent {

  tabs = [
    { key: 'dataElements', name: 'Data Elements' },
    { key: 'category', name: 'Data Category' },
    { key: 'classification', name: 'Data Classification' }
  ];

  selectedTabIndex = 0;
  selectedTab: TabKey = 'dataElements';
  addButtonLabel = 'Add Data Element';
  refreshElements: boolean = false;
  private rolePermissionService = inject(RolePermissionService);
  pdElementFullAcess: boolean = false;

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.pdElementFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  isSearchExpanded: boolean = false;
  searchText: string = '';

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.searchText = '';
    this.selectedTab = this.tabs[index].key as TabKey;
    this.updateButtonLabel();
  }

  onSearch(): void {
    if (this.isSearchExpanded) {
      this.searchText = '';
    }
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  onClose() {
    if (this.isSearchExpanded) {
      this.searchText = '';
    }
  }

  performSearch(): void {

  }

  updateButtonLabel(): void {
    switch (this.selectedTab) {
      case 'dataElements':
        this.addButtonLabel = 'Add Data Element';
        break;
      case 'category':
        this.addButtonLabel = 'Add Data Category';
        break;
      case 'classification':
        this.addButtonLabel = 'Add Data Classification';
        break;
    }
  }

  onAddButtonClick(): void {
    switch (this.selectedTab) {
      case 'dataElements':
        this.openAddDialog('DATA_ELEMENT');
        break;
      case 'category':
        this.openAddDialog('CATEGORY');
        break;
      case 'classification':
        this.openAddDialog('CLASSIFICATION');
        break;
    }
  }

  private openAddDialog(menuName: string): void {
    const dialogRef = this.dialog.open(AddPdElementsDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        editMode: false,
        menuName
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.refreshElements = !this.refreshElements;
      }
    });
  }
}
