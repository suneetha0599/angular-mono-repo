import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { CollectionPointComponent } from './collection-point.component';
import { CollectionPointDetailsComponent } from './collection-point-details/collection-point-details.component';


const { COLLECTION_POINT_LIST, COLLECTION_POINT_DETAILS } = routeConstants


export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.COLLECTION_POINT}` },
        children: [
            { path: '', redirectTo: `${COLLECTION_POINT_LIST}`, pathMatch: 'full', data: { title: `${routesName.COLLECTION_POINT}` } },
            { path: `${COLLECTION_POINT_LIST}`, component: CollectionPointComponent, data: { title: `${routesName.COLLECTION_POINT}`, defaultRoute: true } },
            { path: `${COLLECTION_POINT_DETAILS}/:id`, component: CollectionPointDetailsComponent, data: { title: `${routesName.COLLECTION_POINT_DETAILS}` } },


        ]
    }




];


