import { Routes } from "@angular/router";
import { routes as routeConstants, routesName } from "@admin-core/constants/routes";
import { authGuard } from "@admin-core/guards/auth.guard";
import { featureGuard } from "@admin-core/guards/feature.guard";
import { AssessmentTaskMasterComponent } from "./assessment-task-master.component";

const { ASSESSMENT_TASK } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.ASSESSMENT_TASKS}` },
        children: [
            { path: '', redirectTo: `${ASSESSMENT_TASK}`, pathMatch: 'full', data: { title: `${routesName.ASSESSMENT_TASKS_LIST}`, } },
            { path: `${ASSESSMENT_TASK}`, component: AssessmentTaskMasterComponent, data: { title: `${routesName.ASSESSMENT_TASKS_LIST}`, defaultRoute: true } },
        ]
    }
];