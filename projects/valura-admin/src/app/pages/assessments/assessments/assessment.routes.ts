import { Routes } from '@angular/router';
import { routes as routeConstants, routesName, } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { AssessmentsComponent } from './list-assessment/assessments.component';
import { CreateDpiaAssessmentComponent } from './create-dpia-assessment/create-dpia-assessment.component';
import { AssessmentOverviewComponent } from './assessment-overview/assessment-overview.component';
import { unsavedChangeGuard } from '@admin-core/guards/unsaved-change.guard';
import { ApproveMitigationComponent } from '@admin-page/data-discovery/bpa-listing/create-bpa/risk-summary-screen/approve-mitigation/approve-mitigation.component';
const { ASSESSMENT_QUESTIONS_LIST, CREATE_DPIA_ASSESSMENT, ASSESSMENT_DETAILS, MITIGATION_APPROVE } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.ASSESSMENT_QUESTIONS}` },
        children: [
            { path: '', redirectTo: `${ASSESSMENT_QUESTIONS_LIST}`, pathMatch: 'full', data: { title: `${routesName.ASSESSMENT_QUESTIONS}`, } },
            { path: `${ASSESSMENT_QUESTIONS_LIST}`, component: AssessmentsComponent, data: { title: `${routesName.ASSESSMENT_QUESTIONS_LIST}`, defaultRoute: true } },
            { path: `${CREATE_DPIA_ASSESSMENT}`, component: CreateDpiaAssessmentComponent, data: { title: `${routesName.CREATE_DPIA_ASSESSMENT}` }, canDeactivate: [unsavedChangeGuard] },
            { path: `${ASSESSMENT_DETAILS}/:id`, component: AssessmentOverviewComponent, data: { title: `${routesName.ASSESSMENT_DETAILS}` } },
            { path: `${MITIGATION_APPROVE}/:id`, component: ApproveMitigationComponent, data: { title: `Approve measures` } },
        ]
    }
];
