import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { DownloadComponent } from '../exportDocuments/download.component';

const { VENDOR, ASSESSMENT, TEMPLATES, ASSESSMENT_TASKS_LIST, RISK, DOWNLOAD } = routeConstants

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    // data: { title: `${routesName.VENDORS}` },
    children: [
      { path: '', redirectTo: `${VENDOR}`, pathMatch: 'full', data: { title: `${routesName.VENDORS_LIST}` } },
      { path: `${VENDOR}`, loadChildren: () => import('../vendor-management/vendors/vendor-routes').then(vendor => vendor.routes) },
      { path: `${ASSESSMENT}`, loadChildren: () => import('../assessments/assessments/assessment.routes').then(assessment => assessment.routes) },
      { path: `${TEMPLATES}`, loadChildren: () => import('../assessments/templates/templates.routes').then(vendor => vendor.routes) },
      { path: `${ASSESSMENT_TASKS_LIST}`, loadChildren: () => import('../assessments/assessment-task-master/assessment-task-master.routes').then(task => task.routes) },
      { path: `${RISK}`, loadChildren: () => import('../assessments/assessment-risk-master/assessment-risk-master.routes').then((template) => template.routes) },
      { path: `${DOWNLOAD}`, component: DownloadComponent, data: { title: `${routesName.DOWNLOAD}`, downloadEndpoint: 'assessment/exports/logs', exportType: 'VENDOR' } },
    ]
  }
];

