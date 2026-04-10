import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule, MatSelectTrigger } from '@angular/material/select';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ASSET_TYPE } from '../constant';
import { AssetService } from '@admin-core/services/asset/asset.service';
import { AssetFilterConfiguration } from '@admin-core/models/data-inventory/AssetFilterConfiguaration';

@Component({
  selector: 'app-asset-drawer',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, LoadingButtonComponent, MatIconModule, MatOptionModule, MatSelectModule, MatSelectTrigger],
  templateUrl: './asset-drawer.component.html',
  styleUrl: './asset-drawer.component.scss'
})
export class AssetDrawerComponent {

  @Input() filterConfiguration!: AssetFilterConfiguration;
  @Output() onClose = new EventEmitter<any>();
  @Output() onApply = new EventEmitter<any>();

  assetTypes = ASSET_TYPE;

  private apiHelperService = inject(ApiHelperService);
  private assetService = inject(AssetService);

  ngOnInit() {
    // this.getCategorises();
    // this.getdepartments();
  }

  closeDrawer() {
    this.onClose.emit(true)
  }

  onApplyFilter() {
    this.onApply.emit(this.filterConfiguration);
  }

  // async getCategorises() {
  //   const res = await this.apiHelperService.getCategorises();
  //   if (res) {
  //     this.filterConfiguration.assetCategoryList = res.assetCategories;
  //     this.filterConfiguration.tempselectedAssetCategory = []
  //   }
  //   return
  // }

  // async getdepartments() {
  //   const res = await this.apiHelperService.getAuthDepartmentsList();
  //   if (res) {
  //     this.filterConfiguration.departmentNameList = res;
  //     this.filterConfiguration.tempselectedDepartment = []
  //   }
  //   return
  // }

}
