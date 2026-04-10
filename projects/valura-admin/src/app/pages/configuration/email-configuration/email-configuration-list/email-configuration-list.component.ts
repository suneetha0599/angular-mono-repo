import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { routes as routeConstants } from '@admin-core/constants/routes'
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { PopupDialogData } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { EmailTemplate } from '../email-configuration.model';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { TruncateTooltipDirective } from '../truncate-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { EmailService } from '@admin-core/services/email.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatInput } from '@angular/material/input';
import { RolePermissionService } from '@admin-core/services/permission/role-permission.service';
import { NgModelDebounceChangeDirective } from '@valura-lib/directives/ng-model-debounce/ng-model-debounce-change.directive';
import { FIRST_PAGE, PAGE_SIZE } from '@admin-page/assessments/templates/constants';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';

type SortableColumn = 'name' | 'triggerDescription' | 'subject';

@Component({
  selector: 'app-email-configuration-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatTabsModule,
    FormsModule,
    MatInputModule,
    MatInput,
    NgModelDebounceChangeDirective,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatMenuModule,
    TruncateTooltipDirective,
    MatTooltipModule,
    LoadingButtonComponent,
    MatPaginatorModule,
    ItemNotFoundComponent,
    ErrorLoadingItemsComponent,
    MatFormFieldModule
  ],
  templateUrl: './email-configuration-list.component.html',
  styleUrl: './email-configuration-list.component.scss'
})
export class EmailConfigurationListComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['name', 'triggerDescription', 'subject', 'actions'];
  dataSource!: MatTableDataSource<FormGroup>;
  emailTemplatesForm!: FormGroup;
  selectedTabIndex: number = 0;
  currentPath: string = '';
  dialogRef: MatDialogRef<any> | null = null;
  searchText: string = "";
  showSearch: boolean = false;
  initialListIsEmpty: boolean = false;
  emailFullAccess: boolean = false;

  sortByField: string = '';
  sortDirection: string = '';

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    this.searchText = '';
    if (!this.showSearch) {
      if (this.selectedTabIndex === 0) {
        this.loadEmailTemplates(this.searchText, this.sortByField, this.sortDirection);
      } else {
        this.loadDraftTemplates(this.searchText, this.sortByField, this.sortDirection);
      }
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

  onSearchChange() {
    this.searchText =
      this.searchText.trimStart();
    if (this.selectedTabIndex === 0) {
      this.loadEmailTemplates(this.searchText, this.sortByField, this.sortDirection);
    } else {
      this.loadDraftTemplates(this.searchText, this.sortByField, this.sortDirection);
    }
  }

  onSortChange(event: Sort) {
    const activeColumn = event.active as SortableColumn;
    const backendField = this.sortFieldMapping[activeColumn];

    this.sortByField = backendField ?? '';
    this.sortDirection = event.direction ? event.direction.toUpperCase() : '';

    if (this.selectedTabIndex === 0) {
      this.loadEmailTemplates(this.searchText, this.sortByField, this.sortDirection);
    } else {
      this.loadDraftTemplates(this.searchText, this.sortByField, this.sortDirection);
    }
  }
  get sortFieldMapping(): Record<SortableColumn, string> {
    return {
      name: 'name',
      triggerDescription: 'triggerEvent',
      subject: this.selectedTabIndex === 0 ? 'subject' : 'emailSubject'
    };
  }

  clearSearch() {
    this.searchText = '';
  }

  private apiHelperService = inject(ApiHelperService);
  private rolePermissionService = inject(RolePermissionService)


  allTemplates: EmailTemplate[] = [];

  originalElements: EmailTemplate[] = [];

  draftTemplates: EmailTemplate[] = [];
  isLoading: boolean = true;

  shimmerDataSource: any[] = Array.from({ length: 5 }, (_, i) => ({
    shimmerIndex: i,
    name: '',
    triggerDescription: '',
    subject: '',
    status: ''
  }));
  pageNo = FIRST_PAGE;
  pageSize = PAGE_SIZE;
  totalItems = 0;
  hasApiError: boolean = false;

  constructor(private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private snackbarService: SnackbarService,
    private emailNavigationService: EmailService
  ) { }

  ngOnInit() {
    this.initForm();
    this.loadEmailTemplates(this.searchText, this.sortByField, this.sortDirection);
    this.onInitPage();
  }

  onInitPage(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
    this.setUserPermission();
  }

  setUserPermission() {
    this.emailFullAccess = this.rolePermissionService.fullAccessConfiguration;
  }

  initForm() {
    this.emailTemplatesForm = this.fb.group({
      templates: this.fb.array([])
    });
  }

  get templatesFormArray(): FormArray {
    return this.emailTemplatesForm.get('templates') as FormArray;
  }

  loadTemplates(templates: EmailTemplate[] | undefined) {
    if (!Array.isArray(templates)) {
      this.dataSource = new MatTableDataSource<FormGroup>([]);
      return;
    }

    this.templatesFormArray.clear();

    templates.forEach(template => {
      const templateGroup = this.fb.group({
        name: [template.name],
        triggerDescription: [template.triggerDescription],
        subject: [template.subject],
        status: [template.status],
      });
      this.templatesFormArray.push(templateGroup);
    });

    this.dataSource = new MatTableDataSource(
      this.templatesFormArray.controls as FormGroup[]
    );

    setTimeout(() => {
      this.dataSource.sort = this.sort;
      // this.dataSource.paginator = this.paginator;
    });
  }


  async loadDraftTemplates(
    searchText: string = '',
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    try {
      this.isLoading = true;
      const response = await this.apiHelperService.getManualDrafts(
        {
          page: this.pageNo,
          size: this.pageSize
        },
        {
          sortBy,
          sortDirection,
          searchText
        }
      );


      this.draftTemplates = response || [];
      this.totalItems = this.draftTemplates.length;

      this.loadTemplates(this.draftTemplates);

      if (!this.initialListIsEmpty) {
        if ((!Object.keys(searchText)?.length) && (!response?.length)) {
          this.initialListIsEmpty = true;
        }
      }

    } catch (error: any) {
      this.hasApiError = true;
      console.error('Error loading draft templates:', error);
      this.snackbarService.openSnack('Failed to load draft templates');
    } finally {
      this.isLoading = false;
    }
  }


  get errorTitle() {
    return (this.searchText ? `No email templates match your search criteria`
      : (this.selectedTabIndex === 0 ? `No email templates have been created yet` : ` There are no draft email templates available`))
  }


  async loadEmailTemplates(
    searchText: string = '',
    sortBy: string = '',
    sortDirection: string = ''
  ) {
    try {
      this.isLoading = true;
      this.hasApiError = false;
      const response = await this.apiHelperService.getEmailTemplate(
        {
          page: this.pageNo,
          size: this.pageSize
        },
        {
          sortBy,
          sortDirection,
          searchText
        }
      );
      if (!response || response.success == false || Object.keys(response).length === 0) {
        this.hasApiError = true;
        return
      }
      else {
        this.originalElements = response.templates;
      }
      this.allTemplates = response.templates;
      this.totalItems = +(response.totalItems);

      if (!this.initialListIsEmpty) {
        if ((!Object.keys(searchText)?.length) && (!response?.templates?.length)) {
          this.initialListIsEmpty = true;
        }
      }

      this.loadTemplates(this.allTemplates);
    } catch (e) {
      this.hasApiError = true;
    } finally {
      this.isLoading = false;
    }
  }

  onPageChange(event: PageEvent) {
    this.pageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadEmailTemplates(this.searchText, this.sortByField, this.sortDirection);
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.templatesFormArray.clear();
    this.searchText = '';
    this.sortDirection = '';
    this.sortByField = '';
    this.dataSource = new MatTableDataSource<FormGroup>([]);
    if (index === 0) {
      this.loadEmailTemplates(this.searchText, this.sortByField, this.sortDirection);
    } else {
      this.loadDraftTemplates(this.searchText, this.sortByField, this.sortDirection);
    }
  }

  onCreateTemplate() {
    this.router.navigate([`${this.currentPath}/${routeConstants.EMAIL_CONFIGURATION_CREATE}`]);

  }

  onEditTemplate(element: FormGroup, index: number) {
    const ids: number[] = this.allTemplates.map(t => t.id)
      .filter((id) => id !== undefined);

    const templateId = this.selectedTabIndex === 0
      ? this.allTemplates[index]?.id
      : this.draftTemplates[index]?.id;
    if (!templateId) return;
    this.emailNavigationService.setList(ids, templateId);

    if (templateId) {
      this.router.navigate([`${this.currentPath}/${routeConstants.EMAIL_CONFIGURATION_CREATE}`], {
        queryParams: { id: templateId }
      });
    }
  }

  onDeleteTemplate(element: FormGroup, index: number) {
    const templateData = element.value;


    const templateId = this.selectedTabIndex === 0 ? this.allTemplates[index]?.id : null;
    const draftId = this.selectedTabIndex === 1 ? this.draftTemplates[index]?.id : null;

    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      disableClose: true,
      panelClass: 'dialog-wrapper',
      data: {
        type: 'confirmation',
        title: 'Confirm Deletion',
        content: `Are you sure you want to delete this ${this.selectedTabIndex === 0 ? 'email template' : 'draft'
          }?`,
        confirmationDetail: templateData.name,
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

      try {
        if (this.selectedTabIndex === 0 && templateId) {

          await this.apiHelperService.deleteEmailTemplate(templateId);
          this.allTemplates.splice(index, 1);
        } else if (this.selectedTabIndex === 1 && draftId) {

          await this.apiHelperService.deleteManualDraft(draftId.toString());
          this.draftTemplates.splice(index, 1);
        }

        this.templatesFormArray.removeAt(index);
        this.dataSource.data = [...this.templatesFormArray.controls as FormGroup[]];
        this.loadEmailTemplates(this.searchText, this.sortByField, this.sortDirection);
      } catch (error) {
        console.error(`Error deleting ${this.selectedTabIndex === 0 ? 'template' : 'draft'}:`, error);
      }
    });
  }


  // onPageChange(event: PageEvent) {
  //   if (event) {
  //     this.pageNo = event.pageIndex + 1;
  //     this.pageSize = event.pageSize;
  //   }
  // }

  get isEmptyRequest() {
    return this.dataSource?.data?.length ? false : true
  }


}
