import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-send-assessment-dialog',
  imports: [
    CommonModule,
    MatCardModule,
    MatRadioModule,
    MatIconModule,
    LoadingButtonComponent
  ],
  templateUrl: './send-assessment-dialog.component.html',
  styleUrl: './send-assessment-dialog.component.scss'
})
export class SendAssessmentDialogComponent {
  constructor(public dialog: MatDialogRef<SendAssessmentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private openDialog: MatDialog) { }

  onContinue() {
    // this.dialog.close(0);
    // this.openDialog.open(CreateTaskDialogComponent, {
    //   width: '35%',
    //   height: '43%',
    //   maxWidth: 'none',
    //   maxHeight: 'none',
    //   disableClose: false,
    //   panelClass: 'dialog-wrapper',
    //   autoFocus: false
    // });
  }
}
