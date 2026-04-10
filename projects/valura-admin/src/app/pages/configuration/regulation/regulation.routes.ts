import { Routes } from "@angular/router";
import { authGuard } from "@admin-coreguards/auth.guard";
import { featureGuard } from "@admin-coreguards/feature.guard";
import { routes as routeConstants, routesName } from '@admin-coreconstants/routes';
import { RegulationListComponent } from "./regulation-list/regulation-list.component";
import { RegulationCreateComponent } from "./regulation-create/regulation-create.component";
import { RegulationDetailsComponent } from "./regulation-details/regulation-details.component";
import { DssrDeclarationDetailsComponent } from "./dssr/dssr-declaration-details/dssr-declaration-details.component";

const { REGULATION_LIST, REGULATION_CREATE, REGULATION_DETAILS, DECLARATION_DETAILS } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: `${routesName.REGULATION_CONFIGURATION}` },
    children: [
      {
        path: '',
        redirectTo: REGULATION_LIST,
        pathMatch: 'full',
        data: { title: `${routesName.REGULATION_LIST}` },
      },
      {
        path: REGULATION_LIST,
        component: RegulationListComponent,
        data: { title: routesName.REGULATION_LIST, defaultRoute: true }
      },
      {
        path: REGULATION_CREATE,
        component: RegulationCreateComponent,
        data: { title: routesName.REGULATION_CREATE }
      },
      {
        path: `${REGULATION_CREATE}/:id`,
        component: RegulationCreateComponent,
        data: { title: routesName.REGULATION_CREATE }
      },
      {
        path: `${REGULATION_DETAILS}/:id`,
        component: RegulationDetailsComponent,
        data: { title: routesName.REGULATION_DETAILS }
      },
      {
        path: `${DECLARATION_DETAILS}/:id`,
        component: DssrDeclarationDetailsComponent,
        data: { title: routesName.DECLARATION_DETAILS }
      }
    ]
  }
];
