import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private snackbar: MatSnackBar) { }

  openSnack(message: string, actionText = 'OK', duration = 3000) {
    this.snackbar.open(message, actionText, {
      duration: duration
    })
  }
}
