import { Routes } from "@angular/router";
import { authGuard } from "@admin-core/guards/auth.guard";
import { featureGuard } from "@admin-core/guards/feature.guard";
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { GeneralConfigurationComponent } from "./general-configuration.component";

const { GENERAL_CONFIGURATION_LIST } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: `${routesName.GENERAL_CONFIGURATION}` },
    children: [{ path: '', redirectTo: GENERAL_CONFIGURATION_LIST, pathMatch: 'full', data: { title: `${routesName.GENERAL_CONFIGURATION}` } },
    { path: GENERAL_CONFIGURATION_LIST, component: GeneralConfigurationComponent, data: { title: routesName.GENERAL_CONFIGURATION, defaultRoute: true } },
    ]
  }
];
