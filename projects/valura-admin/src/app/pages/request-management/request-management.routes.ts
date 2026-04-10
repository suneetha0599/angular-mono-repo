import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { unsavedChangeGuard } from '@admin-core/guards/unsaved-change.guard';
import { RequestManagementComponent } from './request-management.component';
import { CreateRequestComponent } from './create-request/create-request.component';
import { RequestManagementDetailsComponent } from './request-management-details/request-management-details.component';
import { DataSubjectDetailsComponent } from './data-subject-details/data-subject-details.component';
import { RequestTaskDetailComponent } from './request-task-detail/request-task-detail.component';

const { REQUEST_MANAGEMENT_LIST, CREATE_REQUEST_MANAGEMENT, REQUEST_MANAGEMENT_DETAILS, REQUEST_DATA_SUBJECT_DETAILS, REQUEST_TASK_MANAGEMENT_DETAILS } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.REQUEST_MANAGEMENT}` },
        children: [
            { path: '', redirectTo: `${REQUEST_MANAGEMENT_LIST}`, pathMatch: 'full', data: { title: `${routesName.REQUEST_MANAGEMENT}`, } },
            { path: `${REQUEST_MANAGEMENT_LIST}`, component: RequestManagementComponent, data: { title: `${routesName.REQUEST_MANAGEMENT}`, defaultRoute: true } },
            { path: `${CREATE_REQUEST_MANAGEMENT}`, component: CreateRequestComponent, data: { title: `${routesName.CREATE_REQUEST_MANAGEMENT}` } },
            { path: `${REQUEST_MANAGEMENT_DETAILS}/:requestRid`, component: RequestManagementDetailsComponent, canDeactivate: [unsavedChangeGuard], data: { title: `${routesName.REQUEST_MANAGEMENT_DETAILS}` } },
            { path: `${REQUEST_DATA_SUBJECT_DETAILS}`, component: DataSubjectDetailsComponent, data: { title: `${routesName.REQUEST_DATA_SUBJECT_DETAILS}` } },
            { path: `${REQUEST_TASK_MANAGEMENT_DETAILS}/:taskRid`, component: RequestTaskDetailComponent, data: { title: `${routesName.TASK_MANAGEMENT_DETAILS}` } },

        ]
    }
];
