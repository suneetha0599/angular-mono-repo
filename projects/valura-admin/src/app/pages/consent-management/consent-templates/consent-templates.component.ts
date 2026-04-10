import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { TemplateViewComponent } from './template-view/template-view.component';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

@Component({
  selector: 'app-consent-templates',
  imports: [CommonModule, ReactiveFormsModule, MatTabsModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, RouterModule, LoadingButtonComponent],
  templateUrl: './consent-templates.component.html',
  styleUrl: './consent-templates.component.scss'
})
export class ConsentTemplatesComponent {

  constructor(private fb: FormBuilder, private dialog: MatDialog) { }
  viewTemplate() {
    this.dialog.open(TemplateViewComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-panel'
    });

  }
}
