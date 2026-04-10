import { Routes } from '@angular/router';
import {
  routes as routeConstants,
  routesName,
} from '../../core/constants/routes';
import { authGuard } from '../../core/guards/auth.guard';
import { featureGuard } from '../../core/guards/feature.guard';
import { unsavedChangeGuard } from '@admin-core/guards/unsaved-change.guard';

const { REGULATION, FORM_CONFIG, CONFIG_DATA_INVENTORY, GENERAL_CONFIGURATION, EMAIL_CONFIGURATION } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    children: [
      { path: `${FORM_CONFIG}`, loadChildren: () => import('./configuration/form-configuration.routes').then((configuration) => configuration.routes) },
      { path: `${REGULATION}`, loadChildren: () => import('./regulation/regulation.routes').then((configuration) => configuration.routes), },
      { path: `${GENERAL_CONFIGURATION}`, loadChildren: () => import('./general-configuration/general-configuration.routes').then((configuration) => configuration.routes), },
      { path: `${EMAIL_CONFIGURATION}`, loadChildren: () => import('./email-configuration/email-configuration.routes').then((config) => config.routes), },
    ],
  },
];
