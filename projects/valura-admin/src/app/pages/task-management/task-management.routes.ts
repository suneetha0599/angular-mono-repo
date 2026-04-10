
import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { TaskManagementComponent } from './task-management.component';
import { TaskDetailsComponent } from './task-details/task-details.component';

const { TASK_MANAGEMENT_LIST, TASK_MANAGEMENT_DETAILS } = routeConstants;

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: routesName.TASK_MANAGEMENT },
        children: [
            {
                path: '',
                redirectTo: TASK_MANAGEMENT_LIST,
                pathMatch: 'full',
                data: { title: routesName.TASK_MANAGEMENT_LIST }
            },
            {
                path: TASK_MANAGEMENT_LIST,
                component: TaskManagementComponent,
                data: { title: routesName.TASK_MANAGEMENT_LIST, defaultRoute: true }
            },
            {
                path: `${TASK_MANAGEMENT_DETAILS}/:taskRid`,
                component: TaskDetailsComponent,
                data: { title: routesName.TASK_MANAGEMENT_DETAILS }
            }
        ]
    }
];