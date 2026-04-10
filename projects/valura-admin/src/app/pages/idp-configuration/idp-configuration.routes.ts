import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '../../core/constants/routes';
import { authGuard } from '../../core/guards/auth.guard';
import { featureGuard } from '../../core/guards/feature.guard';
import { IdpConfigurationListingComponent } from './idp-configuration-listing/idp-configuration-listing.component';

const { IDP_CONFIGURATION_LISTING} = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: routesName.  IDP_CONFIGURATION_LISTING  },
    children: [
      {
        path: '',
        redirectTo: `${IDP_CONFIGURATION_LISTING}`,
        pathMatch: 'full',
        data: { title: routesName.IDP_CONFIGURATION_LISTING }
      },
      {
        path: `${IDP_CONFIGURATION_LISTING}`,
        component: IdpConfigurationListingComponent,
        data: { title: routesName.IDP_CONFIGURATION_LISTING, defaultRoute: true }
      },

    ]
  }
];
