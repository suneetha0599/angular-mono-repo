import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoadingButtonComponent } from '../../../shared/components/loading-button/loading-button.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
@Component({
  selector: 'app-invite-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    LoadingButtonComponent,
    MatFormFieldModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './invite-user-dialog.component.html',
  styleUrls: ['./invite-user-dialog.component.scss']
})
export class InviteUserDialogComponent {
  inviteUser: boolean = false;
  disableBtn: boolean = false;


  constructor(
    private dialogRef: MatDialogRef<InviteUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { submitLoading: boolean, inviteUser: boolean }
  ) {
    this.disableBtn = this.data?.inviteUser
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  onInviteUser(): void {
    this.dialogRef.close({ action: 'save', inviteUser: this.inviteUser });
  }

  get disabled(): boolean {
    return (this.data?.submitLoading || (!this.inviteUser && this.disableBtn))
  }
}
