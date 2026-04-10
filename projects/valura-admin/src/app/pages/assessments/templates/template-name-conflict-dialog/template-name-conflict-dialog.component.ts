import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';

export interface TemplateNameConflictData {
  currentName: string;
  suggestedName: string;
}

@Component({
  selector: 'app-template-name-conflict-dialog',
  imports: [
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingButtonComponent,
  ],
  templateUrl: './template-name-conflict-dialog.component.html',
  styleUrl: './template-name-conflict-dialog.component.scss',
})
export class TemplateNameConflictDialogComponent {
  editedName: string;

  constructor(
    public dialogRef: MatDialogRef<TemplateNameConflictDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TemplateNameConflictData
  ) {
    this.editedName = data.suggestedName;
  }

  onRename() {
    const name = this.editedName?.trim();
    if (name) {
      this.dialogRef.close(name);
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
