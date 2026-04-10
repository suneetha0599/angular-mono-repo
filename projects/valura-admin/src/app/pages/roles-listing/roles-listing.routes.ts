import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { RolesListingComponent } from './roles-listing.component';
import { RoleFormComponent } from './role-form/role-form.component';

const { ROLE_MANAGEMENT_LISTING, ROLE_MANAGEMENT_CREATION, ROLE_MANAGEMENT_DETAILS } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: routesName.ROLE_MANAGEMENT_LISTING },
    children: [
      {
        path: '',
        redirectTo: `${ROLE_MANAGEMENT_LISTING}`,
        pathMatch: 'full',
        data: { title: routesName.ROLE_MANAGEMENT_LISTING }
      },
      {
        path: `${ROLE_MANAGEMENT_LISTING}`,
        component: RolesListingComponent,
        data: { title: routesName.ROLE_MANAGEMENT_LISTING, defaultRoute: true }
      },
      {
        path: `${ROLE_MANAGEMENT_CREATION}`,
        component: RoleFormComponent, // Same component for creation
        data: { title: routesName.ROLE_MANAGEMENT_CREATION }
      },
      {
        path: `${ROLE_MANAGEMENT_DETAILS}/:id`,
        component: RoleFormComponent, // Same component for editing
        data: { title: routesName.ROLE_MANAGEMENT_DETAILS }
      }
    ]
  }
];
