import { Routes } from '@angular/router';
import { routes as routeConstants, routesName, } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { DownloadComponent } from '../exportDocuments/download.component';

const { ASSESSMENT, TEMPLATES, ASSESSMENT_TASKS_LIST, RISK, DOWNLOAD } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        children: [
            { path: `${ASSESSMENT}`, loadChildren: () => import('./assessments/assessment.routes').then(assessment => assessment.routes) },
            { path: `${ASSESSMENT_TASKS_LIST}`, loadChildren: () => import('./assessment-task-master/assessment-task-master.routes').then(task => task.routes) },
            { path: `${TEMPLATES}`, loadChildren: () => import('./templates/templates.routes').then((template) => template.routes) },
            { path: `${RISK}`, loadChildren: () => import('./assessment-risk-master/assessment-risk-master.routes').then((template) => template.routes) },
            { path: `${DOWNLOAD}`, component: DownloadComponent, data: { title: `${routesName.DOWNLOAD}`, downloadEndpoint: 'assessment/exports/logs', exportType: 'NORMAL' } },
        ]
    }
];
