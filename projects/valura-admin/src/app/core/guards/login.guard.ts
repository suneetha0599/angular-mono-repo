import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { FeatureService } from '../services/feature.service';
import { SidenavService } from '../services/sidenav.service';


export const loginGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  const authService = inject(AuthService);
  const featureService = inject(FeatureService);
  const sidenavService = inject(SidenavService);

  const queryParams = route.queryParams;

  if (!authService.isLoggedIn()) {
    authService.setEntryCode(queryParams);
    return true;
  }
  else {
    await featureService.getFeatureList()
    const entryPage = await featureService.getEntryPage(false, queryParams);

    if (entryPage) {
      sidenavService.setPageTittle(entryPage.featureName)
      router.navigate([entryPage.featureRoute], { replaceUrl: true });
      authService.setEntryCode(null);
      return false
    }
    else {
      authService.logOut()
      return true
    }
  }
};
