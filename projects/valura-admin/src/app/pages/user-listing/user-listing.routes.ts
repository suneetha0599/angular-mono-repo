import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '../../core/constants/routes';
import { authGuard } from '../../core/guards/auth.guard';
import { featureGuard } from '../../core/guards/feature.guard';
import { UserListingComponent } from './user-listing.component';
import { UserCreationComponent } from './user-creation/user-creation.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { RoleAssignComponent } from './role-assign/role-assign.component';

const { USER_MANAGEMENT_LISTING, USER_MANAGEMENT_ASSIGN, USER_MANAGEMENT_CREATION, USER_MANAGEMENT_DETAILS } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: routesName.USER_MANAGEMENT_LISTING },
    children: [
      {
        path: '',
        redirectTo: `${USER_MANAGEMENT_LISTING}`,
        pathMatch: 'full',
        data: { title: routesName.USER_MANAGEMENT_LISTING }
      },
      {
        path: `${USER_MANAGEMENT_LISTING}`,
        component: UserListingComponent,
        data: { title: routesName.USER_MANAGEMENT_LISTING, defaultRoute: true }
      },
      {
        path: `${USER_MANAGEMENT_CREATION}`,
        component: UserCreationComponent,
        data: { title: routesName.USER_MANAGEMENT_CREATION }
      },
      {
        path: `${USER_MANAGEMENT_DETAILS}/:id`,
        component: UserDetailsComponent,
        data: { title: routesName.USER_MANAGEMENT_DETAILS }
      },
      {
        path: `${USER_MANAGEMENT_ASSIGN}`,
        component: RoleAssignComponent,
        data: { title: routesName.USER_MANAGEMENT_ASSIGN }
      }

    ]
  }
];
