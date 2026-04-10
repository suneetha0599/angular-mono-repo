import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '../../core/constants/routes';
import { authGuard } from '../../core/guards/auth.guard';
import { featureGuard } from '../../core/guards/feature.guard';
import { BusinessProcessingActivitiesComponent } from './bpa-listing/business-processing-activities/business-processing-activities.component';
import { DataInventoryComponent } from './data-inventory/data-inventory.component';
import { CreateDataElementComponent } from './data-inventory/create-data-element/create-data-element.component';

const { CONSENT_ASSETS, BPA, COLLECTION_POINT, BUSINESS_PROCESSING_ACTIVITIES, DATA_INVENTORY, CREATE_DATA_INVENTORY } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        children: [
            { path: `${CONSENT_ASSETS}`, loadChildren: () => import('./consent-assets/consent-assets.routes').then(assets => assets.routes) },
            { path: `${BPA}`, loadChildren: () => import('./bpa-listing/bpa.routes').then(bpa => bpa.routes) },
            { path: `${BUSINESS_PROCESSING_ACTIVITIES}`, component: BusinessProcessingActivitiesComponent, data: { title: `${routesName.BUSINESS_PROCESSING_ACTIVITIES}` } },
            { path: `${DATA_INVENTORY}`, component: DataInventoryComponent, data: { title: `${routesName.DATA_INVENTORY}` } },
            { path: `${CREATE_DATA_INVENTORY}`, component: CreateDataElementComponent, data: { title: `${routesName.CREATE_DATA_INVENTORY}` } },
            { path: `${COLLECTION_POINT}`, loadChildren: () => import('./collection-point/collection-point.routes').then(collection => collection.routes) },
        ]
    }
];
