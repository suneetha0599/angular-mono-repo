import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatError, MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { NAVIGATION_TYPE, PASSWORD_REGEX, SET_PASSWORD_NAVIGATION_TYPE, SUCCESS_RESET_PASSWORD, UPDATE_PASSWORD } from '@admin-core/constants/constants';
import { AUTH_LOGIN } from '@admin-core/constants/api-constants';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { MatIcon } from '@angular/material/icon';
import { LeftPanelLoginPageComponent } from '@valura-lib/components/left-panel-login-page/left-panel-login-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponenetComponent } from '@valura-lib/components/footer-component/footer-componenet.component';
import { AuthService } from '@admin-core/services/auth.service';
import { routes } from '@admin-core/constants/routes';
import { NgTemplateOutlet } from '@angular/common';

export function matchValidator(matchTo: string, reverse?: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.parent && reverse) {
      const c = (control.parent?.controls as any)[matchTo] as AbstractControl;
      if (c) {
        c.updateValueAndValidity();
      }
      return null;
    }
    return !!control.parent && !!control.parent.value && control.value ===
      (control.parent?.controls as any)[matchTo].value ? null : { matching: true };
  };
}
@Component({
  selector: 'app-set-new-password',
  imports: [FormsModule, LoadingButtonComponent, MatError, MatFormField, MatIcon, MatInput, MatSuffix, ReactiveFormsModule,
    LeftPanelLoginPageComponent, FooterComponenetComponent, MatLabel, NgTemplateOutlet
  ],
  templateUrl: './set-new-password.component.html',
  styleUrl: './set-new-password.component.scss'
})
export class SetNewPasswordComponent {

  loginForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  UPDATE_PASSWORD = UPDATE_PASSWORD
  SUCCESS_RESET_PASSWORD = SUCCESS_RESET_PASSWORD
  VIEW_TYPE = UPDATE_PASSWORD
  requestId: string = '';
  isLoading: boolean = false;
  isPattern: boolean = false;
  navigationType: number = 0;
  skipBtnLoading: boolean = false;
  routeViewType: string = '';
  ROUTE_TYPE = NAVIGATION_TYPE;
  onInitInviteLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiHelperService: ApiHelperService,
    private snackbarService: SnackbarService,
    private httpService: HttpService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.setViewTypeBasedOnRoute();
    this.loginForm = this.fb.group({
      password: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
      confirmPassword: ['', [Validators.required, matchValidator('password')]],
    });

    this.route.queryParams.subscribe(params => {
      this.requestId = params['requestId'] || '';
      const navigationType = params['type'];
      if (navigationType) {
        this.navigationType = +(navigationType);
      }
    });
    this.password.valueChanges.subscribe(() => {
      this.isPattern = this.password.hasError('pattern');
    });
    this.onInitPage();
  }

  onInitPage() {
    if (this.routeViewType == NAVIGATION_TYPE.INVITE_RESET_PASSWORD) {
      this.initInviteChange(this.requestId)
    }
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.snackbarService.openSnack('Invalid form!');
      return;
    }

    const body = {
      password: this.password.value,
    };

    this.isLoading = true;

    try {
      const res = await this.apiHelperService.updatePassword(body);
      this.isLoading = false;
      const resp = {
        data: { forgotPasswordInitiated: false, passwordChangeRequired: false, inviteUserSuccess: this.inviteUser }
      }
      this.authService.navigateBasedOnContext(resp);
      if (this.inviteUser) {
        this.snackbarService.openSnack(`Password updated successfully!`);
      }
      this.authService.removeViewType()
    } catch (error) {
      this.isLoading = false;
      console.error(error);
    }
  }

  returnLogin() {
    this.router.navigate([`/${routes.LOGIN}`]);
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.loginForm.get('confirmPassword') as FormControl;
  }

  get passwordErrorMessage() {
    if (this.password.hasError('required')) {
      return "This field is required";
    }
    if (this.password.hasError('pattern')) {
      return 'Password must be at least 8 characters with one uppercase, one lowercase, one digit, and one special character';
    }
    return '';
  }

  get confirmPasswordErrorMessage() {
    if (this.confirmPassword.hasError('required')) {
      return "This field is required";
    }
    if (this.confirmPassword.hasError('matching')) {
      return 'Passwords do not match';
    }
    return '';
  }

  get showSkipLink() {
    return this.navigationType == SET_PASSWORD_NAVIGATION_TYPE.LOGIN ? true : false
  }

  onClickSkipButton() {
    if (this.skipBtnLoading) {
      return
    }
    this.skipBtnLoading = true;
    const resp = {
      data: { forgotPasswordInitiated: false, passwordChangeRequired: false, }
    }
    this.authService.navigateBasedOnContext(resp);
    this.skipBtnLoading = false;
  }

  setViewTypeBasedOnRoute() {
    const path = this.router.url;
    if (!path) {
      this.routeViewType = NAVIGATION_TYPE.RESET_PASSWORD
    }
    if (path.includes(routes.INVITE_RESET_PASSWORD)) {
      this.routeViewType = NAVIGATION_TYPE.INVITE_RESET_PASSWORD;
      this.authService.setViewType(this.routeViewType);
      return
    }
    else {
      this.routeViewType = NAVIGATION_TYPE.RESET_PASSWORD
    }
  }

  initInviteChange(tempToken: string) {
    const body = {
      "inviteUserToken": tempToken,
      "platform": this.authService.platform
    }
    this.onInitInviteLoading = true
    this.apiHelperService.authorizeUser(body, AUTH_LOGIN).subscribe({
      next: (res: any) => {
        if (this.httpService.isSuccess(res.body.success)) {
          if (res.body.data?.isExpired) {
            this.router.navigate([`/${routes.LOGIN}`], {
              state: { key: NAVIGATION_TYPE.FORGOT_PASSWORD, isReadOnly: true }
            })
          }
          else {
            const data = { ...res.body, setPasswordNavigationType: SET_PASSWORD_NAVIGATION_TYPE.FORGOT_PASSWORD }
            this.authService.doLogin(data);
          }
          this.onInitInviteLoading = false;
          return
        }
        // this.returnLogin();
        this.onInitInviteLoading = false;
      },
      error: (e: Error) => {
        // this.returnLogin();
        console.error(e);
        this.onInitInviteLoading = false;
      },
    })
  }

  get inviteUser(): boolean {
    const viewType = this.authService.getViewType();
    return viewType == NAVIGATION_TYPE.INVITE_RESET_PASSWORD ? true : false
  }

}
