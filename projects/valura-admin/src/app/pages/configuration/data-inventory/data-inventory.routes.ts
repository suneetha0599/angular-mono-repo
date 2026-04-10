import { Routes } from '@angular/router';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { DataInventoryComponent } from './data-inventory.component';
import { CategoryDetailsComponent } from './category-details/category-details.component';




const { CONFIG_DATA_INVENTORY_LIST, CONFIG_DATA_INVENTORY, CATEGORY_DETAILS } = routeConstants

export const routes: Routes = [
    {
        path: '',
        canActivateChild: [authGuard, featureGuard],
        data: { title: `${routesName.CONFIG_DATA_INVENTORY}` },
        children: [
            { path: '', redirectTo: `${CONFIG_DATA_INVENTORY_LIST}`, pathMatch: 'full', data: { title: `${routesName.CONFIG_DATA_INVENTORY}` } },
            { path: `${CONFIG_DATA_INVENTORY_LIST}`, component: DataInventoryComponent, data: { title: `${routesName.CONFIG_DATA_INVENTORY}`, defaultRoute: true } },
            { path: `${CATEGORY_DETAILS}/:id`, component: CategoryDetailsComponent, data: { title: `${routesName.CATEGORY_DETAILS}` } },


        ]
    }
];
