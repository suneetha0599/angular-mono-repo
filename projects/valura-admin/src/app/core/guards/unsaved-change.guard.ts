import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AuthService } from '@admin-core/services/auth.service';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { Observable, from, of } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean> | Promise<boolean>;
}

export const unsavedChangeGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component
): Observable<boolean> | boolean => {
  if (!component.canDeactivate) {
    return true;
  }

  const authService = inject(AuthService);
  if (!authService.isLoggedIn()) {
    return true;
  }

  const result = component.canDeactivate();

  // If result is a boolean, handle it directly
  if (typeof result === 'boolean') {
    if (result) {
      return true;
    }
    // Show default dialog for false returns
    const cd = inject(ConfirmationDialogService);
    return new Observable<boolean>((observer) => {
      cd.showDialog(
        'Alert',
        'You have unsaved changes that will be lost. Are you sure you want to leave this page?',
        'Yes',
        'No',
        '420px',
      ).subscribe((dialogResult) => {
        observer.next(!!dialogResult);
        observer.complete();
      });
    });
  }

  // If result is a Promise, convert to Observable
  if (result instanceof Promise) {
    return from(result);
  }

  // If result is already an Observable, return it
  return result;
};
