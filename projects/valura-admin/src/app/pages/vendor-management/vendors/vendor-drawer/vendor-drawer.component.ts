import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectTrigger } from '@angular/material/select';
import { FilterConfiguration } from '@admin-core/models/request-management/FilterConfiguration';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { STATUS } from '../constant';

@Component({
  selector: 'app-vendor-drawer',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, LoadingButtonComponent, MatIconModule, MatOptionModule, MatSelectModule, MatSelectTrigger],
  templateUrl: './vendor-drawer.component.html',
  styleUrl: './vendor-drawer.component.scss'
})
export class VendorDrawerComponent {

  @Input() filterConfiguration!: FilterConfiguration;
  @Output() onClose = new EventEmitter<any>();
  @Output() onApply = new EventEmitter<any>();
  status = STATUS;

  ngOnInit() {
  }

  closeDrawer() {
    this.onClose.emit(true)
  }

  onApplyFilter() {
    this.onApply.emit(this.filterConfiguration);
  }
}
