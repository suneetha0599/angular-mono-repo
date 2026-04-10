import { CanActivateFn, CanActivateChildFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FeatureService } from '../services/feature.service';
import { routes as routeConstants } from '@admin-core/constants/routes';

const { LOGIN, NOT_FOUND } = routeConstants
// export const featureGuard: CanActivateFn = (route, state) => {
//   return handleRouteAccess(state);
// };

export const featureGuard: CanActivateChildFn = async (childRoute, state) => {
  return await handleRouteAccess(state);
};

async function handleRouteAccess(state: RouterStateSnapshot): Promise<boolean> {
  const authService = inject(AuthService);
  const router = inject(Router);
  const featureService = inject(FeatureService);

  const url = getUrl(state.url);

  if (!authService.isLoggedIn()) {
    router.navigate([`${LOGIN}`], { replaceUrl: true });
    return false;
  }
  // return true
  const featureList = await featureService.getFlatFeatureFlatList();

  for (const feature of featureList) {
    if (url && hasMatch(feature.featureRoute ?? '', url)) {
      return true;
    }
  }
  router.navigate([`${NOT_FOUND}`], { replaceUrl: true });
  return false;
}


function hasMatch(featureRoute: string, reqRoute: string): boolean {
  const path = getUrl(reqRoute);
  if (featureRoute === path) return true;

  return allowedUrlList.some(
    allowed =>
      path.includes(allowed.childUrl) && featureRoute.includes(allowed.parentUrl)
  );
}

const allowedUrlList = [
  // { parentUrl: '/user/task-management', childUrl: '/user/task-management/' },
  { parentUrl: '/user/dsrr', childUrl: '/user/dsrr/' },
  { parentUrl: '/user/data-discovery', childUrl: '/user/data-discovery/' },
  { parentUrl: '/user/vendors', childUrl: '/user/vendors/' },
  { parentUrl: '/user/assessments', childUrl: '/user/assessments/' },
  { parentUrl: '/admin', childUrl: '/admin/' },
  { parentUrl: '/user', childUrl: '/user/profile' },
  { parentUrl: '/admin', childUrl: '/admin/profile' },
  { parentUrl: '/user', childUrl: '/user/download' },
];

function getUrl(url: string): string {
  try {
    return url.split('?')[0] ?? '';
  } catch (e) {
    return '';
  }
}
