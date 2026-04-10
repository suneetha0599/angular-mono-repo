import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@admin-core/services/auth.service';
import { ADMIN_USER, EXTERNAL_USER, INTERNAL_USER, PLATFORM, SET_PASSWORD_NAVIGATION_TYPE, SSO_AUTH, SSO_EXTERNAL_AUTH, SSO_INTERNAL_AUTH } from '@admin-core/constants/constants';
import { AUTH_LOGIN, EXTERNAL_AUTH_VALIDATE, INTERNAL_AUTH_VALIDATE } from '@admin-core/constants/api-constants';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { routes } from '@admin-core/constants/routes';


@Component({
  selector: 'app-sso-auth',
  imports: [MatProgressSpinnerModule],
  templateUrl: './sso-auth.component.html',
  styleUrl: './sso-auth.component.scss'
})
export class SsoAuthComponent {

  isLoading: boolean = true;

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);
  private apiHelperService = inject(ApiHelperService);
  private httpService = inject(HttpService);
  private snackbarService = inject(SnackbarService);
  userType: string = ADMIN_USER;

  ngOnInit(): void {
    this.route.queryParams.subscribe({
      next: async (params) => {
        let tempToken = params['tempToken'];
        if (tempToken) {
          this.setUserTypeBasedOnRoute();
          this.loginWithAuthToken(tempToken)
          return
        }
        this.navigateToLoginPage()
      }
    });

  }

  loginWithAuthToken(tempToken: string) {
    if (!tempToken) {
      this.snackbarService.openSnack("Invalid temporary token!")
      return
    }
    if (this.userType == ADMIN_USER) {
      this.doAdminUserLogin(tempToken);
    }
    else if (this.userType == INTERNAL_USER) {
      this.doInternalUserLogin(tempToken);
    }
    else if (this.userType == EXTERNAL_USER) {
      this.doExternalUserLogin(tempToken);
    }
  }

  doAdminUserLogin(tempToken: string) {
    const body = {
      "tempToken": tempToken,
      "platform": this.authService.platform
    }
    this.isLoading = true
    this.apiHelperService.authorizeUser(body, AUTH_LOGIN).subscribe({
      next: (res: any) => {
        if (this.httpService.isSuccess(res.body.success)) {
          const data = { ...res.body, setPasswordNavigationType: SET_PASSWORD_NAVIGATION_TYPE.LOGIN }
          if (this.authService.authUser) {
            this.authService.doAuthLogin(data)
          }
          else {
            this.authService.doLogin(data)
          }
          this.isLoading = false;
          return
        }
        this.navigateToLoginPage();
        this.isLoading = false;
      },
      error: (e: Error) => {
        this.navigateToLoginPage();
        console.error(e);
        this.isLoading = false;
      },
    })
  }

  doInternalUserLogin(tempToken: string) {
    const body = {
      "tempToken": tempToken,
    }
    this.isLoading = true
    this.apiHelperService.authorizeUser(body, INTERNAL_AUTH_VALIDATE).subscribe({
      next: (res: any) => {
        if (this.httpService.isSuccess(res.body.success)) {
          const data = { ...res.body }
          this.authService.doLogin(data)
          this.isLoading = false;
          return
        }
        this.navigateToLoginPage();
        this.isLoading = false;
      },
      error: (e: Error) => {
        this.navigateToLoginPage();
        console.error(e);
        this.isLoading = false;
      },
    })
  }

  doExternalUserLogin(tempToken: string) {
    const body = {
      "tempToken": tempToken,
    }
    this.isLoading = true
    this.apiHelperService.authorizeUser(body, EXTERNAL_AUTH_VALIDATE).subscribe({
      next: (res: any) => {
        if (this.httpService.isSuccess(res.body.success)) {
          const data = { ...res.body }
          this.authService.doLogin(data)
          this.isLoading = false;
          return
        }
        this.navigateToLoginPage();
        this.isLoading = false;
      },
      error: (e: Error) => {
        this.navigateToLoginPage();
        console.error(e);
        this.isLoading = false;
      },
    })
  }
  navigateToLoginPage() {
    this.authService.clearStorage();
    this.router.navigate([routes.LOGIN], { replaceUrl: true });
  }

  setUserTypeBasedOnRoute() {
    const path = this.router.url;
    if (!path) {
      return
    }
    if (path.includes(SSO_INTERNAL_AUTH)) {
      this.userType = INTERNAL_USER
      return
    }
    if (path.includes(SSO_EXTERNAL_AUTH)) {
      this.userType = EXTERNAL_USER
      return
    }
  }
}

