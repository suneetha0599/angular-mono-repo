import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { BpaListingComponent } from './bpa-listing.component';
import { CreateBpaComponent } from './create-bpa/create-bpa.component';
import { BpaDFDDetailsComponent } from './bpa-dfd-details/bpa-dfd-details.component';
import { ApproveMitigationComponent } from './create-bpa/risk-summary-screen/approve-mitigation/approve-mitigation.component';
import { unsavedChangeGuard } from '@admin-core/guards/unsaved-change.guard';



const { BPA_LIST, BPA_CREATE, BPA_DETAILS, BPA_DFD_DETAILS, MITIGATION_APPROVE } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.BPA}` },
        children: [
            { path: '', redirectTo: `${BPA_LIST}`, pathMatch: 'full', data: { title: `${routesName.CONSENT_ASSETS}` } },
            { path: `${BPA_LIST}`, component: BpaListingComponent, data: { title: `${routesName.BPA_LIST}`, defaultRoute: true } },
            { path: `${BPA_CREATE}`, component: CreateBpaComponent, data: { title: `${routesName.BPA_CREATE}` }, canDeactivate: [unsavedChangeGuard], },
            { path: `${BPA_DETAILS}`, component: CreateBpaComponent, data: { title: `${routesName.BPA_DETAILS}` } },
            { path: `${BPA_DFD_DETAILS}`, component: BpaDFDDetailsComponent, data: { title: `${routesName.BPA_DETAILS}` } },
            { path: `${MITIGATION_APPROVE}`, component: ApproveMitigationComponent, data: { title: `${MITIGATION_APPROVE}` } },

        ]
    }
];
