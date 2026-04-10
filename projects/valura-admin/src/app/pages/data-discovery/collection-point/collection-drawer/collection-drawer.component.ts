import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { COLLECTION_TYPE } from '../../consent-assets/constant';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { LoadingButtonComponent } from "@valura-lib/components//loading-button/loading-button.component";
import { CollectionPointFilterConfiguration } from '@admin-core/models/data-inventory/collectionPointFilterConfiguration';

@Component({
  selector: 'app-collection-drawer',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, LoadingButtonComponent],
  templateUrl: './collection-drawer.component.html',
  styleUrl: './collection-drawer.component.scss'
})
export class CollectionDrawerComponent {

  @Input() filterConfiguration!: CollectionPointFilterConfiguration;
  @Output() onClose = new EventEmitter<any>();
  @Output() onApply = new EventEmitter<any>();

  collectionTypes = COLLECTION_TYPE;

  closeDrawer() {
    this.onClose.emit(true)
  }

  onApplyFilter() {
    this.onApply.emit(this.filterConfiguration);
  }



}
