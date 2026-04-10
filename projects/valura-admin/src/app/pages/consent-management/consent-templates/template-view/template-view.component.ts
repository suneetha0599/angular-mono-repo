import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-template-view',
  imports: [MatIconModule, MatFormFieldModule, FormsModule, ReactiveFormsModule, MatInputModule, MatCheckboxModule, LoadingButtonComponent],
  templateUrl: './template-view.component.html',
  styleUrl: './template-view.component.scss'
})
export class TemplateViewComponent {
  constructor(public dialogRef: MatDialogRef<TemplateViewComponent>,) { }

  close() {
    this.dialogRef.close();
  }
}
