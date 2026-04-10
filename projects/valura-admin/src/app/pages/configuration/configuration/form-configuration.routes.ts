import { Routes } from '@angular/router';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { FormConfigurationComponent } from './form-configuration.component';
import { routes as routeConstants, routesName } from '@admin-core/constants/routes';
import { DsrFormPreviewComponent } from './dsr-form-preview/dsr-form-preview.component';
import { unsavedChangeGuard } from '@admin-core/guards/unsaved-change.guard';

const { FORM_CONFIG_PREVIEW, FORM_CONFIG_CREATE } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: `${routesName.FORM_CONFIG}` },

    children: [
      {
        path: '',
        redirectTo: `${FORM_CONFIG_CREATE}`,
        pathMatch: 'full',
        data: { title: `${routesName.FORM_CONFIG}` },
      },
      {
        path: FORM_CONFIG_CREATE,
        component: FormConfigurationComponent,
        data: { title: `${routesName.FORM_CONFIG}`, defaultRoute: true },
        canDeactivate: [unsavedChangeGuard],
      },
      {
        path: FORM_CONFIG_PREVIEW,
        component: DsrFormPreviewComponent,
        data: { title: `${routesName.FORM_CONFIG_PREVIEW}` },
      },
    ],
  },
];
