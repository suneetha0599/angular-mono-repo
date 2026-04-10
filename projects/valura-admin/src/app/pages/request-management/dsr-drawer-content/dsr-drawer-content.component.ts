import { Component, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { FilterConfiguration } from '@admin-core/models/request-management/FilterConfiguration';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { CustomDateAdapter } from '@valura-lib/adapters/CustomNgxDatetimeAdapter';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { OPEN, DRAFTS, DOWNLOAD_COLUMNS } from '../constant';
import { User } from '@admin-core/models/user.model';
import { AuthService } from '@admin-core/services/auth.service';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ExportDrawerComponent } from "@valura-lib/components//export-drawer/export-drawer.component";
import { PRIORITY_OPTIONS } from '@admin-core/constants/constants';
import { EFFORT_LEVELS } from '@admin-core/constants/constants';

const CUSTOM_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'l, LTS'
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
}

@Component({
  selector: 'dsr-drawer-content',
  imports: [MatIconModule, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, LoadingButtonComponent, ReactiveFormsModule, MatRadioModule, MatCheckboxModule, ExportDrawerComponent],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ],
  templateUrl: './dsr-drawer-content.component.html',
  styleUrl: './dsr-drawer-content.component.scss'
})
export class DsrDrawerContentComponent {

  FILTER = 'FILTER'
  EXPORT = 'EXPORT'

  @Input() viewType: string = this.FILTER
  @Input() isFromTask: boolean = false
  @Input() filterConfiguration!: FilterConfiguration
  @Input() selectedTab!: string;
  @Input() viewContext: string = 'DSR';
  downloadType: 'NORMAL' | 'CUSTOM' = 'NORMAL';

  columns = DOWNLOAD_COLUMNS.map(c => ({
    ...c,
    selected: true
  }));
  @Output() onDownload = new EventEmitter<any>();

  @Output() onCloseDrawer = new EventEmitter<any>()
  @Output() onApplyFilter = new EventEmitter<any>()

  pageTitle: string = ''
  OPEN = OPEN;
  DRAFTS = DRAFTS;
  maxDateFilter = new Date();
  minToDateFilter = new Date();

  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private authService = inject(AuthService);
  private configApiHelperService = inject(ConfigApiHelperService);

  @ViewChild('fromDate') fromDate!: NgModel;
  @ViewChild('toDate') toDate!: NgModel;

  constructor() {
    let today = new Date();
    today.setHours(23, 59, 9);
    this.maxDateFilter = today;

  }


  ngOnInit(): void {
    this.onInitPage()
  }

  filterCountries(searchValue: string) {
    const value = searchValue?.toLowerCase() || '';

    this.filterConfiguration.filteredCountryList =
      this.filterConfiguration.countryList.filter(country =>
        country.name.toLowerCase().includes(value)
      );
  }

  clearSearch(input: HTMLInputElement) {
    if (input) {
      input.value = '';
    }

    this.filterConfiguration.filteredCountryList =
      [...this.filterConfiguration.countryList];
  }

  //   ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['filterConfiguration'] && !changes['filterConfiguration'].firstChange) {
  //     this.onInitPage();
  //   }
  // }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewType']) {
      this.onInitPage();
    }
    this.filterConfiguration.priorityOptions = PRIORITY_OPTIONS;
    this.filterConfiguration.effortlevels = EFFORT_LEVELS;
  }


  onDownloadTypeChange(type: 'NORMAL' | 'CUSTOM') {
    this.downloadType = type;
  }

  onColumnToggle(column: any, checked: boolean) {
    column.selected = checked;
  }


  closeDrawer() {
    this.onCloseDrawer.emit(true)
  }

  applyDownload() {
    if (this.downloadType === 'NORMAL') {
      this.onDownload.emit({ type: 'NORMAL' });
      return;
    }

    const selectedColumns = this.columns
      .filter(c => c.selected)
      .map(c => c.key);

    this.onDownload.emit({
      type: 'CUSTOM',
      columns: selectedColumns
    });
  }

  onExportDownload(event: { type: 'NORMAL' | 'CUSTOM'; columns: string[] }) {
    this.onDownload.emit(event);
  }

  onInitPage() {
    if (this.viewType == this.EXPORT) {
      this.pageTitle = "Report"
    }
    else if (this.viewType == this.FILTER) {
      this.pageTitle = "Filter"
      this.filterConfiguration.tempSearchText = this.filterConfiguration.searchText || '';

      if (!this.isTemplateContext) {
        this.filterConfiguration.tempFromDate = this.filterConfiguration.fromDate;
        this.filterConfiguration.tempToDate = this.filterConfiguration.toDate;
      }

      if (this.isTemplateContext) {
        this.filterConfiguration.tempSelectedTemplateType = [
          ...this.filterConfiguration.selectedTemplateType
        ];
        this.filterConfiguration.tempSelectedStatus = [
          ...this.filterConfiguration.selectedStatus
        ];
      }
    }
  }

  onApply() {
    if (!this.isTemplateContext) {
      if (this.fromDate?.invalid || this.toDate?.invalid) {
        this.snackbarService.openSnack("Invalid date input!")
        return
      }
      this.filterConfiguration.fromDate = this.filterConfiguration.tempFromDate;
      this.filterConfiguration.toDate = this.filterConfiguration.tempToDate;

      if (this.filterConfiguration.tempFromDate) {
        let minToDate = new Date(this.filterConfiguration.tempFromDate);
        minToDate.setHours(0, 0, 0);
        this.minToDateFilter = minToDate;
      }
    }

    this.filterConfiguration.searchText = this.filterConfiguration.tempSearchText;
    this.onApplyFilter.emit(this.filterConfiguration);
  }

  onDateChange(filterConfiguration: FilterConfiguration, toDate: boolean = false) {
    if (toDate) {
      // filterConfiguration.toDate = moment(this.filterConfiguration.toDate,).format("YYYY-MM-DD")
    }
    else {
      // filterConfiguration.fromDate = moment(this.filterConfiguration.fromDate,).format("YYYY-MM-DD")
      let minToDate = new Date(this.filterConfiguration.tempFromDate);
      minToDate.setHours(0, 0, 0);
      this.minToDateFilter = minToDate;
    }
  }

  async onCountryChange(event: MatSelectChange) {
    await this.getCoutryConfiguration()
  }

  async getCoutryConfiguration() {
    const param = {
      countryId: this.filterConfiguration.tempSelectedCountry.map(r => r.id)
    }
    if (param.countryId?.length) {
      const res = await this.configApiHelperService.getCountryConfiguration(param);
      this.filterConfiguration.requestTypeList = (res?.dataSubjectRights ?? []);
      this.filterConfiguration.tempSelectedRequestType = []
    }
    else {
      this.filterConfiguration.requestTypeList = []
      this.filterConfiguration.tempSelectedRequestType = []
    }
  }

  get showFilter() {
    return this.isFromTask ? false : true
  }

  getDisplayName(assignedTo: User) {
    return `${assignedTo.displayName ? (assignedTo.displayName) : `${assignedTo.firstName ? `${assignedTo.firstName} ${assignedTo.lastName ?? ''}` : `${assignedTo.email ?? ''}`}`}`
  }

  getDisplayNameOfLevels(level: any) {
    return level.label;
  }

  getPriorityName(priority: any) {
    if (priority === "HIGH") {
      return "High";
    } else if (priority === "MEDIUM") {
      return "Medium";
    } else {
      return "Low"
    }
  }

  get showAssignedToFilter(): boolean {
    return (!this.authService.isExternalUser && !this.authService.isInternalUser)
  }

  get showAssignedToUserFilter(): boolean {
    return (!this.authService.isAdminUser)
  }

  get isTemplateContext(): boolean {
    return this.viewContext === 'TEMPLATE';
  }


  onClearAll() {
    this.filterConfiguration.tempSearchText = '';

    this.filterConfiguration.tempSelectedStatus = [];
    this.filterConfiguration.tempSelectedCountry = [];
    this.filterConfiguration.tempSelectedRequestType = [];
    this.filterConfiguration.tempSelectedDataSubject = [];
    this.filterConfiguration.tempSelectedAssignedTo = [];
    this.filterConfiguration.tempSelectedAssigner = [];
    this.filterConfiguration.tempSelectedLevelofEfforts = [];
    this.filterConfiguration.tempSelectedPriority = [];
    this.filterConfiguration.tempSelectedChannel = [];
    this.filterConfiguration.tempSelectedThrough = [];

    if (this.isTemplateContext) {
      this.filterConfiguration.tempSelectedTemplateType = [];
    }
    this.filterConfiguration.searchText = '';
    this.filterConfiguration.selectedStatus = [];
    this.filterConfiguration.selectedCountry = [];
    this.filterConfiguration.selectedRequestType = [];
    this.filterConfiguration.selectedDataSubject = [];
    this.filterConfiguration.selectedAssignedTo = [];
    this.filterConfiguration.selectedChannel = [];

    if (this.isTemplateContext) {
      this.filterConfiguration.selectedTemplateType = [];
    }
    this.onApplyFilter.emit(this.filterConfiguration);
  }



  templateTypeId(o1: any, o2: any) {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

}
