import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { CountryListingComponent } from './country-listing.component';
import { CountryFormComponent } from './country-form/country-form.component';

const { COUNTRY_MANAGEMENT_LISTING, COUNTRY_MANAGEMENT_CREATION, COUNTRY_MANAGEMENT_DETAILS } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: routesName.COUNTRY_MANAGEMENT_LISTING },
    children: [
      {
        path: '',
        redirectTo: `${COUNTRY_MANAGEMENT_LISTING}`,
        pathMatch: 'full',
        data: { title: routesName.COUNTRY_MANAGEMENT_LISTING }
      },
      {
        path: `${COUNTRY_MANAGEMENT_LISTING}`,
        component: CountryListingComponent,
        data: { title: routesName.COUNTRY_MANAGEMENT_LISTING, defaultRoute: true }
      },
      {
        path: `${COUNTRY_MANAGEMENT_CREATION}`,
        component: CountryFormComponent,
        data: { title: routesName.COUNTRY_MANAGEMENT_CREATION }
      },
      {
        path: `${COUNTRY_MANAGEMENT_DETAILS}/:id`,
        component: CountryFormComponent,
        data: { title: routesName.COUNTRY_MANAGEMENT_DETAILS }
      }
    ]
  }
];
