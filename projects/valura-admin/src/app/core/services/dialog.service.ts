import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable, take } from 'rxjs';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { ConfirmationDialogComponent } from '@valura-lib/components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialog: MatDialog) { }

  openConfirmDialog({ title = "Confirm", message = '', innerHtml = "", cancelText = 'Cancel', confirmText = "Confirm", stopEvent = false, disableClose = false, width = '500px' }): Observable<any> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,

      ...(width ? { width } : {}),
      ...(disableClose ? { disableClose } : {}),

      panelClass: 'dialog-wrapper',

      data: {
        title,
        message,
        innerHtml,
        cancelText,
        confirmText,
        stopEvent
      }
    });



    return dialogRef.afterClosed()
      .pipe(
        take(1),
        map(res => {
          return res;
        })
      )
  }
}
