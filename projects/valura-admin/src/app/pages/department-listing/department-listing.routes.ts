import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { DepartmentListingComponent } from './department-listing.component';
import { DepartmentFormComponent } from './department-form/department-form.component';

const { DEPARTMENT_MANAGEMENT_LISTING, DEPARTMENT_MANAGEMENT_CREATION, DEPARTMENT_MANAGEMENT_DETAILS } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: routesName.DEPARTMENT_MANAGEMENT_LISTING },
    children: [
      {
        path: '',
        redirectTo: `${DEPARTMENT_MANAGEMENT_LISTING}`,
        pathMatch: 'full',
        data: { title: routesName.DEPARTMENT_MANAGEMENT_LISTING }
      },
      {
        path: `${DEPARTMENT_MANAGEMENT_LISTING}`,
        component: DepartmentListingComponent,
        data: { title: routesName.DEPARTMENT_MANAGEMENT_LISTING, defaultRoute: true }
      },
      {
        path: `${DEPARTMENT_MANAGEMENT_CREATION}`,
        component: DepartmentFormComponent,
        data: { title: routesName.DEPARTMENT_MANAGEMENT_CREATION }
      },
      {
        path: `${DEPARTMENT_MANAGEMENT_DETAILS}/:id`,
        component: DepartmentFormComponent,
        data: { title: routesName.DEPARTMENT_MANAGEMENT_DETAILS }
      }
    ]
  }
];
