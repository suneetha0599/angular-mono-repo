import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { CreatePurposeComponent } from './create-purpose/create-purpose.component';
import { TermPageComponent } from './term-page/term-page.component';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { ConsentManagementPreviewComponent } from './consent-management-preview/consent-management-preview.component';
import { WithdrawConsentComponent } from './consent-records/withdraw-consent/withdraw-consent.component';
import { ConsentDetailsComponent } from './consent-records/consent-details/consent-details.component';
import { DataSubjectDetailComponent } from './consent-records/data-subject-detail/data-subject-detail.component';
import { ConsentManagementComponent } from './consent-management.component';

const { CONSENT_MANAGEMENT_LIST, CONSENT_MANAGEMENT_CREATE, CONSENT_TERM_PAGE, CONSENT_MANAGEMENT_PREVIEW, WITHDRAW_CONSENT, DATA_SUBJECT_DETAILS, CONSENT_MANAGEMENT_DETAILS } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        children: [
            { path: '', redirectTo: `${CONSENT_MANAGEMENT_LIST}`, pathMatch: 'full', data: { title: `${routesName.CONSENT_MANAGEMENT}` } },
            { path: `${CONSENT_MANAGEMENT_LIST}`, component: ConsentManagementComponent, data: { title: `${routesName.CONSENT_MANAGEMENT}` } },
            { path: `${CONSENT_MANAGEMENT_CREATE}`, component: CreatePurposeComponent, data: { title: `${routesName.CONSENT_MANAGEMENT_CREATE}` } },
            { path: `${CONSENT_MANAGEMENT_PREVIEW}`, component: ConsentManagementPreviewComponent, data: { title: `${routesName.CONSENT_MANAGEMENT_PREVIEW}` } },
            { path: `${CONSENT_MANAGEMENT_DETAILS}`, component: ConsentDetailsComponent, data: { title: `${routesName.CONSENT_MANAGEMENT_DETAILS}` } },

            { path: `${CONSENT_TERM_PAGE}`, component: TermPageComponent, data: { title: `${routesName.CONSENT_MANAGEMENT_TERM_PAGE}` } },
            // { path: `${CONSENT_TEMPLATES}`, component: ConsentTemplatesComponent, data: { title: `${routesName.CONSENT_MANAGEMENT_TEMPLATES}` } },
            // { path: `${CONSENT_RECORDS}`, component: ConsentRecordsComponent, data: { title: `${routesName.CONSENT_RECORDS}` } },
            { path: `${WITHDRAW_CONSENT}`, component: WithdrawConsentComponent, data: { title: `${routesName.WITHDRAW_CONSENT}` } },
            { path: `${DATA_SUBJECT_DETAILS}`, component: DataSubjectDetailComponent, data: { title: `${routesName.DATA_SUBJECT_DETAILS}` } },
            // { path: `${CONSENT_MANAGEMENT_DETAILS}`, component: ConsentDetailsComponent, data: { title: `${routesName.CONSENT_MANAGEMENT_DETAILS}` } },

        ]
    }
];
