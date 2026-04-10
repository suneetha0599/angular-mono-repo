import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { VendorListingComponent } from './vendor-listing/vendor-listing.component';
import { VendorDetailsComponent } from './vendor-details/vendor-details.component';
import { CreateVendorRecordComponent } from './create-vendor-record/create-vendor-record.component';
import { unsavedChangeGuard } from '@admin-core/guards/unsaved-change.guard';

const { VENDORS_LIST, VENDORS_DETAILS, VENDORS_CREATE, CREATE_VENDOR_RECORD } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.VENDORS}` },
        children: [
            { path: '', redirectTo: `${VENDORS_LIST}`, pathMatch: 'full', data: { title: `${routesName.VENDORS_LIST}` } },
            { path: `${VENDORS_LIST}`, component: VendorListingComponent, data: { title: `${routesName.VENDORS_LIST}`, defaultRoute: true } },
            { path: `${VENDORS_DETAILS}`, component: VendorDetailsComponent, data: { title: `${routesName.VENDORS_DETAILS}` } },
            { path: `${VENDORS_CREATE}`, component: VendorDetailsComponent, data: { title: `${routesName.VENDORS_CREATE}` } },
            { path: `${CREATE_VENDOR_RECORD}`, component: CreateVendorRecordComponent, data: { title: `${routesName.CREATE_VENDOR_RECORD}` }, canDeactivate: [unsavedChangeGuard] },
        ]
    }
];