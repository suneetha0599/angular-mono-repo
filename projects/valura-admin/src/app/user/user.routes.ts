import { Routes } from '@angular/router';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { UserComponent } from './user.component';
import { featureGuard } from '../core/guards/feature.guard';
import { authGuard } from '../core/guards/auth.guard';
import { routes as routeConstants, routesName } from '../core/constants/routes';
import { UserProfileComponent } from '../pages/user-profile/user-profile.component';

import { DownloadComponent } from '../pages/exportDocuments/download.component';
import { BadNetworkComponent } from '@valura-lib/components/bad-network/bad-network.component';
import { ItemNotFoundComponent } from '@valura-lib/components/item-not-found/item-not-found.component';
import { NotFoundComponent } from '@valura-lib/components/not-found/not-found.component';


const { USER, ADMIN, DASHBOARD, CONSENT_MANAGEMENT_PURPOSE, ROLE_MANAGEMENT, USER_MANAGEMENT, COUNTRY_MANAGEMENT, CONSENT_MANAGEMENT_TEMPLATES, CONSENT_MANAGEMENT_FORMS,
  CONSENT_MANAGEMENT_RECORDS, USER_PROFILE, BAD_NETWORK, ITEM_NOT_FOUND, DATA_DISCOVERY, VENDORS, CONFIGURATION, ASSESSMENTS, DOWNLOAD, DSRR } = routeConstants

export const userRoutes: Routes = [
  {
    path: `${ADMIN}`, component: UserComponent, canActivateChild: [authGuard, featureGuard], children:
      [
        { path: '', redirectTo: `${DASHBOARD}`, pathMatch: 'full' },
        { path: `${DASHBOARD}`, component: DashboardComponent, data: { title: `${routesName.DASHBOARD}` } },
        { path: `${USER_PROFILE}`, component: UserProfileComponent, data: { title: `${routesName.USER_PROFILE}` } },
        { path: `${USER_MANAGEMENT}`, loadChildren: () => import('../pages/user-listing/user-listing.routes').then(userRoutes => userRoutes.routes) },
        { path: `${ROLE_MANAGEMENT}`, loadChildren: () => import('../pages/roles-listing/roles-listing.routes').then(roleRoutes => roleRoutes.routes) },
        { path: `${COUNTRY_MANAGEMENT}`, loadChildren: () => import('../pages/country-listing/country-listing.routes').then(countryRoutes => countryRoutes.routes) },
        { path: `${CONFIGURATION}`, loadChildren: () => import('../pages/configuration/configuration.routes').then(configurationRoutes => configurationRoutes.routes) },
        // { path: `${DOWNLOAD}`, component: DownloadComponent, data: { title: `${routesName.DOWNLOAD}` } },
        // Add other routes
      ]
  },
  {
    path: `${USER}`, component: UserComponent, canActivateChild: [authGuard, featureGuard], children:
      [
        { path: '', redirectTo: `${DASHBOARD}`, pathMatch: 'full' },
        { path: `${DASHBOARD}`, component: DashboardComponent, data: { title: `${routesName.DASHBOARD}` } },
        // { path: `${REQUEST_MANAGEMENT}`, loadChildren: () => import('../pages/request-management/request-management.routes').then(requestManagement => requestManagement.routes) },
        // { path: `${TASK_MANAGEMENT}`, loadChildren: () => import('../pages/task-management/task-management.routes').then(taskRoutes => taskRoutes.routes) },
        { path: `${DSRR}`, loadChildren: () => import('../pages/request-management/dsrr.routes').then(dsrr => dsrr.routes) },
        { path: `${DATA_DISCOVERY}`, loadChildren: () => import('../pages/data-discovery/data-discovery.routes').then(dataDiscovery => dataDiscovery.routes) },
        { path: `${ASSESSMENTS}`, loadChildren: () => import('../pages/assessments/assessments.routes').then(assessmentQuestions => assessmentQuestions.routes) },
        { path: `${VENDORS}`, loadChildren: () => import('../pages/vendor-management/vendor-management.routes').then(vendor => vendor.routes) },
        /*   Consent Managemnt Screens */
        { path: `${CONSENT_MANAGEMENT_PURPOSE}`, loadChildren: () => import('../pages/consent-management/consent-management.routes').then(consentManagement => consentManagement.routes) },
        { path: `${CONSENT_MANAGEMENT_TEMPLATES}`, loadChildren: () => import('../pages/consent-management/consent-management.routes').then(consentManagement => consentManagement.routes) },
        { path: `${CONSENT_MANAGEMENT_FORMS}`, loadChildren: () => import('../pages/consent-management/consent-management.routes').then(consentManagement => consentManagement.routes) },
        { path: `${CONSENT_MANAGEMENT_RECORDS}`, loadChildren: () => import('../pages/consent-management/consent-management.routes').then(consentManagement => consentManagement.routes) },

        { path: `${USER_PROFILE}`, component: UserProfileComponent, data: { title: `${routesName.USER_PROFILE}` } },
        { path: `${DOWNLOAD}`, component: DownloadComponent, data: { title: `${routesName.DOWNLOAD}` } },
        { path: `${BAD_NETWORK}`, component: BadNetworkComponent, data: { title: `${routesName.BAD_NETWORK}` } },
        { path: `${ITEM_NOT_FOUND}`, component: ItemNotFoundComponent, data: { title: `${routesName.ITEM_NOT_FOUND}` } },
        { path: '**', component: NotFoundComponent, data: { title: `${routesName.ERROR_404}` } },

        // Add other routes
      ]
  }
];
