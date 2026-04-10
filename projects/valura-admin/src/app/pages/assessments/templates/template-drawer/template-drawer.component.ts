import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from '@angular/forms';
import { LoadingButtonComponent } from "@valura-lib/components//loading-button/loading-button.component";
import { templateFilterConFiguration } from '@admin-core/models/assessment/templateFilterConfiguration';

@Component({
  selector: 'app-template-drawer',
  imports: [MatIconModule, MatFormFieldModule, MatSelectModule, FormsModule, LoadingButtonComponent],
  templateUrl: './template-drawer.component.html',
  styleUrl: './template-drawer.component.scss'
})
export class TemplateDrawerComponent {

  pageTitle: string = 'Filter'
  @Input() filterConfiguration!: templateFilterConFiguration

  @Output() onCloseDrawer = new EventEmitter<any>()
  @Output() onApplyFilter = new EventEmitter<any>()

  @Input() selectedTabIndex!: number;

  get showStatus(): boolean {
    return this.selectedTabIndex === 0;
  }

  closeDrawer() {
    this.onCloseDrawer.emit(true)
  }


  onApply() {
    this.onApplyFilter.emit(this.filterConfiguration);
  }


}
