import { Routes } from '@angular/router';
import { routes as routeConstants } from './core/constants/routes';
import { LoginComponent } from './pages/auth/login/login.component';
import { InternalLoginComponent } from './pages/auth/internal-login/internal-login.component';
import { ExternalLoginComponent } from './pages/auth/external-login/external-login.component';
import { downloadGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { SetNewPasswordComponent } from './pages/auth/set-new-password/set-new-password.component';
import { SsoAuthComponent } from './pages/auth/sso-auth/sso-auth.component';
import { DownloadLayoutComponent } from '@valura-lib/components/download-layout/download-layout.component';
import { LayoutComponent } from '@valura-lib/components/layout/layout.component';
import { NotFoundComponent } from '@valura-lib/components/not-found/not-found.component';

const { LOGIN, EXTERNAL_LOGIN, INTERNAL_LOGIN, NOT_FOUND, RESET_PASSWORD, DOWNLOAD_LAYOUT, SSO_AUTH, SSO_INTERNAL_AUTH, SSO_EXTERNAL_AUTH, INVITE_RESET_PASSWORD } = routeConstants;

export const routes: Routes = [
    { path: '', redirectTo: `/${LOGIN}`, pathMatch: 'full' },
    { path: `${LOGIN}`, component: LoginComponent, canActivate: [loginGuard] },
    { path: `${SSO_AUTH}`, component: SsoAuthComponent },
    { path: `${SSO_INTERNAL_AUTH}`, component: SsoAuthComponent },
    { path: `${SSO_EXTERNAL_AUTH}`, component: SsoAuthComponent },
    { path: `${INTERNAL_LOGIN}`, component: InternalLoginComponent, canActivate: [loginGuard] },
    { path: `${EXTERNAL_LOGIN}`, component: ExternalLoginComponent, canActivate: [loginGuard] },
    { path: `${DOWNLOAD_LAYOUT}`, component: DownloadLayoutComponent, canActivate: [downloadGuard] },
    { path: `${RESET_PASSWORD}`, component: SetNewPasswordComponent },
    { path: `${INVITE_RESET_PASSWORD}`, component: SetNewPasswordComponent },
    { path: '', component: LayoutComponent, loadChildren: () => import('./user/user.routes').then(m => m.userRoutes) },
    { path: `${NOT_FOUND}`, component: NotFoundComponent },
    { path: '**', component: NotFoundComponent },
];