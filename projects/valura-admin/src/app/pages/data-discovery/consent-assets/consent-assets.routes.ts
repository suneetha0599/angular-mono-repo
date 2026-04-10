import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { ConsentAssetsComponent } from './consent-assets.component';
import { CreateAssetsComponent } from './create-assets/create-assets.component';
import { AssetsDetailsComponent } from './assets-details/assets-details.component';


const { CONSENT_ASSETS_LIST, CREATE_ASSETS, ASSETS_DETAILS, } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.CONSENT_ASSETS}` },
        children: [
            { path: '', redirectTo: `${CONSENT_ASSETS_LIST}`, pathMatch: 'full', data: { title: `${routesName.CONSENT_ASSETS}` } },
            { path: `${CONSENT_ASSETS_LIST}`, component: ConsentAssetsComponent, data: { title: `${routesName.CONSENT_ASSETS}`, defaultRoute: true } },
            { path: `${CREATE_ASSETS}`, component: CreateAssetsComponent, data: { title: `${routesName.CREATE_ASSETS}` } },
            { path: `${ASSETS_DETAILS}/:assetId`, component: AssetsDetailsComponent, data: { title: `${routesName.ASSETS_DETAILS}` } },

        ]
    }
];
