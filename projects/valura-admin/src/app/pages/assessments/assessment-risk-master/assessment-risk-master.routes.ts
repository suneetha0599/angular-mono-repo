import { Routes } from "@angular/router";
import { routes as routeConstants, routesName } from "@admin-core/constants/routes";
import { authGuard } from "@admin-core/guards/auth.guard";
import { featureGuard } from "@admin-core/guards/feature.guard";
import { AssessmentRiskMasterComponent } from "./assessment-risk-master.component";

const { ASSESSMENT_RISK } = routeConstants;

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.RISK}` },
        children: [
            { path: '', redirectTo: `${ASSESSMENT_RISK}`, pathMatch: 'full', data: { title: `${routesName.RISK}`, } },
            { path: `${ASSESSMENT_RISK}`, component: AssessmentRiskMasterComponent, data: { title: `${routesName.RISK}`, defaultRoute: true } },
        ]
    }
]
