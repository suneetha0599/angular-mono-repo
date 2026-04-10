import { Routes } from '@angular/router';
import { routes as routeConstants, routesName, } from '@admin-core/constants/routes';
import { authGuard } from '@admin-core/guards/auth.guard';
import { featureGuard } from '@admin-core/guards/feature.guard';
import { ListTemplateComponent } from './list-template/list-template.component';
import { CreateAssessmentComponent } from './create-assessment/create-assessment.component';
import { unsavedChangeGuard } from '@admin-core/guards/unsaved-change.guard';
import { TemplateDetailsComponent } from './template-details/template-details.component';
import { PreviewTemplateComponent } from './preview-template/preview-template.component';

const { CREATE_TEMPLATE, TEMPLATE_LIST, TEMPLATE_DETAILS, PREVIEW_TEMPLATE } = routeConstants;

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard, featureGuard],
    data: { title: `${routesName.TEMPLATES}` },
    children: [
      { path: '', redirectTo: `${TEMPLATE_LIST}`, pathMatch: 'full', data: { title: `${routesName.TEMPLATE_LIST}`, } },
      { path: `${TEMPLATE_LIST}`, component: ListTemplateComponent, data: { title: `${routesName.TEMPLATE_LIST}`, defaultRoute: true } },
      { path: `${TEMPLATE_DETAILS}`, component: TemplateDetailsComponent, data: { title: `${routesName.TEMPLATE_DETAILS}` } },
      { path: `${PREVIEW_TEMPLATE}/:id`, component: PreviewTemplateComponent, data: { title: `${routesName.PREVIEW_TEMPLATE}` }, canDeactivate: [unsavedChangeGuard] },
      { path: `${CREATE_TEMPLATE}`, component: CreateAssessmentComponent, data: { title: `${routesName.CREATE_ASSESSMENT}` }, canDeactivate: [unsavedChangeGuard] },
    ]
  }
];
