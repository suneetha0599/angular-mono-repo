import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { DownloadComponent } from '../exportDocuments/download.component';
const { REQUEST_MANAGEMENT, TASK_MANAGEMENT, DOWNLOAD } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        children: [
            { path: `${REQUEST_MANAGEMENT}`, loadChildren: () => import('../request-management/request-management.routes').then(requestManagement => requestManagement.routes), data: { title: `${routesName.DSRR}` } },
            { path: `${TASK_MANAGEMENT}`, loadChildren: () => import('../task-management/task-management.routes').then(taskManagement => taskManagement.routes) },
            { path: `${DOWNLOAD}`, component: DownloadComponent, data: { title: `${routesName.DOWNLOAD}` } },
        ]
    }
];
