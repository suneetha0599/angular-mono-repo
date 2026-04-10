import { Routes } from "@angular/router";
import { authGuard } from "@admin-core/guards/auth.guard";
import { featureGuard } from "@admin-core/guards/feature.guard";
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { EmailConfigurationCreateComponent } from "./email-configuration-create/email-configuration-create.component";
import { EmailConfigurationListComponent } from "./email-configuration-list/email-configuration-list.component";

const { EMAIL_CONFIGURATION, EMAIL_CONFIGURATION_CREATE, EMAIL_CONFIGURATION_LIST } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: `${routesName.EMAIL_CONFIGURATION}` },
    children: [
      {
        path: '',
        redirectTo: EMAIL_CONFIGURATION_LIST,
        pathMatch: 'full',
        data: { title: `${routesName.EMAIL_CONFIGURATION_LIST}` },
      },
      {
        path: EMAIL_CONFIGURATION_LIST,
        component: EmailConfigurationListComponent,
        data: { title: routesName.EMAIL_CONFIGURATION_LIST, defaultRoute: true }
      },
      {
        path: EMAIL_CONFIGURATION_CREATE,
        component: EmailConfigurationCreateComponent,
        data: { title: routesName.EMAIL_CONFIGURATION_CREATE }
      }
    ]
  }
];
