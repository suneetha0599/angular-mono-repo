import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@core/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(public dialog: MatDialog) { }

  showDialog(title: string, content: string, positiveButton: string, negativeButton?: string, width?: string, disableClose?: boolean): Observable<boolean> {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
  ...GLOBAL_DIALOG_DEFAULTS,
  disableClose: disableClose ?? true,
  panelClass: 'dialog-wrapper',
  data: {
    title,
    content,
    positiveButton,
    negativeButton,
  }
});
    return ref.afterClosed().pipe(
      map(result => {
        return result;
      }),
    );
  }

  dismissDialog() {
    this.dialog.closeAll();
  }
}
