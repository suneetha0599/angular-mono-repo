import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { GENERAL_CONFIG_STAGES, GeneralTabKey, PD_ELEMENTS_MENU } from './constant';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { DepartmentsTableComponent, Department } from './departments/departments-table/departments-table.component';
import { AddDepartmentDialogComponent } from './departments/add-department-dialog/add-department-dialog.component';
import { GeneralDataSubjectsComponent } from './data-subject/general-data-subjects/general-data-subjects.component';
import { AddDataSubjectComponent } from './data-subject/add-data-subject/add-data-subject.component';
import { AddPdElementsDialogComponent } from './add-pd-elements-dialog/add-pd-elements-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { PdElementsComponent } from './pd-elements/pd-elements.component';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { CreateDepartmentPayload } from '@admin-core/models/department-management/department.model';
import { PopupDialogComponent, PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { AUDIT_LOG_ENTITY_TYPE, AUDIT_LOG_MODULE, GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ActivityStepperDialogComponent } from '@admin-page/request-management/request-management-dialog/activity-stepper-dialog/activity-stepper-dialog.component';
@Component({
  selector: 'app-general-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatMenuModule,
    NgTemplateOutlet,
    LoadingButtonComponent,
    DepartmentsTableComponent,
    GeneralDataSubjectsComponent,
    PdElementsComponent
    // AddDepartmentDialogComponent
  ],
  templateUrl: './general-configuration.component.html',
  styleUrl: './general-configuration.component.scss'
})
export class GeneralConfigurationComponent implements OnInit {
  menu = PD_ELEMENTS_MENU;

  currentPath: string = '';
  pageTitle = 'General Configuration';
  selectedTabIndex = 0;
  tabHeaderDetails = GENERAL_CONFIG_STAGES
  GeneralTabKey = GeneralTabKey;
  selectedTab: string = GeneralTabKey.PD_ELEMENTS;
  AddDepartmentDialogComponent = AddDepartmentDialogComponent;
  addButtonLabel: string = '';
  loadDataSubject: boolean = true;
  departments: Department[] = [];
  isSearchExpanded: boolean = false;
  searchText: string = '';
  refreshElements: boolean = false;
  hasApiError = false;
  requestLoading = true;
  initialListIsEmpty = false;
  generalFullAcess: boolean = false;


  @ViewChild(GeneralDataSubjectsComponent)
  generalDataSubjectsComp!: GeneralDataSubjectsComponent;

  private router = inject(Router);
  private apiHelperService = inject(ApiHelperService);
  private departmentService = inject(DepartmentService);
  private snackbarService = inject(SnackbarService);
  private rolePermissionService = inject(RolePermissionService);

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.onInitPage();
    this.loadDepartments();
  }
  onInitPage(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.addButtonLabel = this.tabHeaderDetails[0].addButtonLabel
    this.setUserPermissions();
  }

  setUserPermissions() {
    this.generalFullAcess = this.rolePermissionService.fullAccessConfiguration;
  }

  onTabChange(index: number): void {
    const tabKey = this.tabHeaderDetails[index]?.key;
    this.selectedTabIndex = index;
    this.selectedTab = tabKey;
    this.addButtonLabel = this.tabHeaderDetails[index].addButtonLabel;
    if (this.isSearchExpanded) {
      this.onSearch();
    }
  }
  onAddButtonClick(menuName: string = '') {
    if (this.selectedTab == GeneralTabKey.PD_ELEMENTS) {
      const dialogRef = this.dialog.open(AddPdElementsDialogComponent, {
        ...GLOBAL_DIALOG_DEFAULTS,   // apply global defaults (width, maxHeight, autoFocus)

        disableClose: true,
        panelClass: 'dialog-wrapper',
        data: {
          editMode: false,
          menuName: menuName
        }
      });

      dialogRef.afterClosed().subscribe(res => {
        if (res) {
          this.refreshElements = !this.refreshElements;
        }
      });
    }
    else if (this.selectedTab == GeneralTabKey.DATA_SUBJECTS) {
      const dialogRef = this.dialog.open(AddDataSubjectComponent, {
        ...GLOBAL_DIALOG_DEFAULTS,   // width, maxHeight, autoFocus from constant

        disableClose: false,
        panelClass: 'dialog-wrapper',
        width: '26%',
        maxHeight: '70vh',
        autoFocus: false,
      });


      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.loadDataSubject = false;
          setTimeout(() => {
            this.loadDataSubject = true;
          }, 100);
        }
      });
    }
    else if (this.selectedTab == GeneralTabKey.DEPARTMENTS) {
      const dialogRef = this.dialog.open(AddDepartmentDialogComponent, {
        ...GLOBAL_DIALOG_DEFAULTS,   // applies maxHeight + autoFocus only

        disableClose: true,
        panelClass: 'dialog-wrapper',
        width: '26%',
        maxHeight: '70vh',
        autoFocus: false,

        data: { editMode: false }
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result?.success) {
          await this.loadDepartments(false);
        }
      });
    }
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
  async loadDepartments(forceLoad: boolean = false): Promise<void> {
    this.hasApiError = false;
    try {
      const response = await this.departmentService.getDepartmentMasterList(forceLoad);
      if (response) {
        this.departments = response;
      } else {
        this.departments = [];
        this.initialListIsEmpty = true;
      }
      if (this.departments.length > 0) {
        this.requestLoading = true;
      } else {
        this.requestLoading = false;
      }
    } catch (error: any) {
      this.hasApiError = true;
      console.error('Error:', error);
      this.departments = [];
    }
  }

  ShowActivityLog() {
    let auditLogs;

    if (this.selectedTab === GeneralTabKey.PD_ELEMENTS) {
      auditLogs = AUDIT_LOG_ENTITY_TYPE.PERSONAL_DATA_ELEMENTS;
    } else if (this.selectedTab === GeneralTabKey.DATA_SUBJECTS) {
      auditLogs = AUDIT_LOG_ENTITY_TYPE.DATA_SUBJECTS;
    } else if (this.selectedTab === GeneralTabKey.DEPARTMENTS) {
      auditLogs = AUDIT_LOG_ENTITY_TYPE.DEPARTMENT_MANAGEMENT;
    }

    this.dialog.open(ActivityStepperDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      disableClose: true,
      data: {
        entityId: 0,
        auditLogs: auditLogs,
        audit_log_module: AUDIT_LOG_MODULE.CONFIGURATION
      }
    });
  }

  async handleDepartmentView(department: Department): Promise<void> {
    const dialogRef = this.dialog.open(AddDepartmentDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: false,
      panelClass: 'dialog-wrapper',
      width: '26%',
      maxHeight: '70vh',
      autoFocus: false,

      data: {
        departmentId: department.id,
        viewMode: true
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.success) {

        await this.loadDepartments(false);
      }
    });
  }


  async handleDepartmentEdit(department: Department): Promise<void> {
    const dialogRef = this.dialog.open(AddDepartmentDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',
      width: '26%',
      maxHeight: '70vh',
      autoFocus: false,

      data: {
        editMode: true,
        departmentId: department.id
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.success) {

        await this.loadDepartments(false);
      }
    });
  }
  async handleDepartmentDelete(department: Department): Promise<void> {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this department?',
        confirmationDetail: department.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning_amber',
        iconColor: 'text-red-600'
      } as PopupDialogData
    });


    const confirmed = await dialogRef.afterClosed().toPromise();

    if (!confirmed) {
      return;
    }

    try {
      const response: any = await this.apiHelperService.deleteDepartment(department.id);

      if (response) {
        await this.departmentService.deleteDepartment(department.id);
        await this.loadDepartments(false);
      }
    } catch (error: any) {
      console.error('[General Config] Error deleting department:', error);
    }
  }
}

