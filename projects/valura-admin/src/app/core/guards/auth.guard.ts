import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { routes as routeConstants } from '@admin-core/constants/routes';

const { LOGIN } = routeConstants

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate([`${LOGIN}`]);
    return false;
  }
};

export const downloadGuard: CanActivateChildFn = (childRoute, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isDownloadLoaded()) {
    return true;
  } else {
    router.navigate([`${LOGIN}`]);
    return false;
  }
};
