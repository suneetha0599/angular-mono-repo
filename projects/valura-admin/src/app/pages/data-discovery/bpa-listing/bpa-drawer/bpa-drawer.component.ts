import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectTrigger } from '@angular/material/select';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { DepartmentService } from '@admin-core/services/department/department.service';
import { DataSubjectService } from '@admin-core/services/dataSubject/data-subject.service';
import { CountryService } from '@admin-core/services/country/country.service';
import { FREQUENCIES, STATUS } from '../constants';
import { BpaFilterConfiguration } from '@admin-core/models/data-inventory/BpaFilterConfiguration';

@Component({
  selector: 'app-bpa-drawer',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LoadingButtonComponent,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    MatSelectTrigger,
  ],
  templateUrl: './bpa-drawer.component.html',
  styleUrl: './bpa-drawer.component.css',
})
export class BpaDrawerComponent {
  @Input() filterConfiguration!: BpaFilterConfiguration;
  @Output() onClose = new EventEmitter<any>();
  @Output() onApply = new EventEmitter<any>();

  frequencies = FREQUENCIES;

  status = STATUS;

  private departmentService = inject(DepartmentService);

  private dataSubjectService = inject(DataSubjectService);

  private countryService = inject(CountryService);

  ngOnInit() {
    this.getdepartments();
    this.getDataSubject();
    this.getRegion();
    this.getFrequency();
    this.getStatus();
  }

  closeDrawer() {
    this.onClose.emit(true);
  }

  onApplyFilter() {
    this.onApply.emit(this.filterConfiguration);
  }

  async getdepartments() {
    const res = await this.departmentService.getDepartmentMasterList();

    if (res) {
      this.filterConfiguration.departmentNameList = res;
      // this.filterConfiguration.tempselectedDepartment = [];
    }
    return;
  }

  async getDataSubject() {
    const res = await this.dataSubjectService.getDatasubjectMasterList();

    if (res) {
      this.filterConfiguration.dataSubjectList = res;
      // this.filterConfiguration.tempSelectedDataSubject = [];
    }
    return;
  }

  async getRegion() {
    const res = await this.countryService.getCountryMasterList();

    if (res) {
      this.filterConfiguration.countryList = res;
      // this.filterConfiguration.tempSelectedCountry = [];
    }
    return;
  }

  getFrequency() {
    // this.filterConfiguration.tempSelectedFrequencies = [];
    this.filterConfiguration.frequencies = this.frequencies;
  }

  getStatus() {
    // this.filterConfiguration.tempSelectedStatus = [];
    this.filterConfiguration.statusList = this.status;
  }
}
