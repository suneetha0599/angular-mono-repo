import { Component, inject, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EMAIL_REGEX, LOGIN, NAVIGATION_TYPE, PASSWORD_REGEX, RESEND_LINK, RESET_PASSWORD, SET_PASSWORD_NAVIGATION_TYPE, SSO_AUTH, SUCCESS_RESET_PASSWORD, UPDATE_PASSWORD, VERIFY_OTP } from '@admin-core/constants/constants';
import { NgClass } from '@angular/common';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { HttpService } from '@valura-lib/service/network/http.service';
import { AuthService } from '@admin-core/services/auth.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { AUTH_LOGIN, AUTH_RESEND_OTP, AUTH_UPDATE_PASSWORD, AUTH_VERIFY_OTP } from '@admin-core/constants/api-constants';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { LeftPanelLoginPageComponent } from '@valura-lib/components/left-panel-login-page/left-panel-login-page.component';
import { FooterComponenetComponent } from "@valura-lib/components/footer-component/footer-componenet.component";
import { Router } from '@angular/router';
import { routes } from '@admin-core/constants/routes';
import { environment } from '../../../../environments/environment';

export interface IdpConfig {
  name: string;
  redirectUrl: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, NgClass, LeftPanelLoginPageComponent, LoadingButtonComponent, FooterComponenetComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm!: FormGroup;
  LOGIN = LOGIN
  RESET_PASSWORD = RESET_PASSWORD
  RESEND_LINK = RESEND_LINK
  VERIFY_OTP = VERIFY_OTP
  UPDATE_PASSWORD = UPDATE_PASSWORD
  SUCCESS_RESET_PASSWORD = SUCCESS_RESET_PASSWORD
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  VIEW_TYPE: string = LOGIN
  focusedOtpIndex = -1;
  otpTimerDisplay = '02:00s';
  otpArray = [0, 1, 2, 3]
  isLoading: boolean = false;
  idpConfigs: IdpConfig[] = [];
  forgotPasswordToken!: string;
  otpDuration = 120;
  otpRemainingTime = 0;
  otpInterval: any = null;
  canResendOtp = false;



  private apiHelperService = inject(ApiHelperService);
  private httpService = inject(HttpService);
  private authService = inject(AuthService);
  private snackbarService = inject(SnackbarService);
  private router = inject(Router);

  constructor(private fb: FormBuilder,) { }

  @ViewChildren('otpInput') otpInputs!: any;

  ngOnInit(): void {
    this.onInitPage();
  }

  onInitPage() {
    this.authService.clearAuthData();
    this.loadIdpConfig()
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required, Validators.pattern(PASSWORD_REGEX)]],
      otp0: [''],
      otp1: [''],
      otp2: [''],
      otp3: [''],
    }, { validators: this.passwordMatchValidator });
    this.setViewType()
  }
  // redirectToIdp(url: string) {
  //   const newWindow = window.open(url, '_blank'); 
  // }

  redirectToIdp(url: string) {
    window.location.href = url;
  }

  onSubmit() {
    if (this.VIEW_TYPE == this.RESET_PASSWORD) {
      this.resetPassword()
    }
    else if (this.VIEW_TYPE == this.VERIFY_OTP) {
      this.verifyOtp()
    }
    else if (this.VIEW_TYPE == this.UPDATE_PASSWORD) {
      this.updatePassword()
    }
    else {
      this.doLogin()
    }
  }

  async loadIdpConfig(): Promise<void> {
    try {
      const res: any = await this.apiHelperService.getLogin();
      this.idpConfigs = res?.idpConfigs ?? [];
    } catch (err) {
      console.error('Failed to load IDP config', err);
      this.idpConfigs = [];
    }
  }

  loginWithIdp(data: any): void {
    const baseUrl = window.location.origin;

    const payload = {
      idpType: data.idpType,
      registrationId: data.registrationId,
      frontendUrl: baseUrl,
      path: SSO_AUTH,
      query: ''
    };

    this.apiHelperService.preLogin(payload).subscribe({
      next: res => {
        if (res?.redirectUrl) {
          window.location.href = environment.api + res.redirectUrl;
        }
      },
      error: err => {
        console.error('Pre-login error:', err.message);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onclickForgotPassword() {
    this.email.setValue(null)
    this.password.setValue(null)
    this.VIEW_TYPE = RESET_PASSWORD;
    this.authService.removeViewType();
  }

  onClickResendOtp() {
    for (const otp of this.otpArray) {
      let otpControl = this.loginForm.get(`otp${otp}`)
      otpControl?.setValue('')
    }
    if (this.canResendOtp) {
      this.resetPassword()
    }

  }

  // Move to next input
  focusNext(index: number, event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Move forward on digit input
    if (value && value.length === 1 && index < this.otpInputs.length - 1) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
    }

    // Move backward on backspace
    if (event.key === 'Backspace' && !value && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
    }
  }


  get email() {
    return this.loginForm.get('email') as FormControl
  }

  get password() {
    return this.loginForm.get('password') as FormControl
  }

  get confirmPassword() {
    return this.loginForm.get('confirmPassword') as FormControl
  }


  doLogin() {
    if (this.email.invalid || this.password.invalid) {
      this.snackbarService.openSnack("Invalid form!")
      return
    }
    const body = {
      "email": this.email.value,
      "password": this.password.value,
      "platform": this.authService.platform
    }
    this.isLoading = true
    this.apiHelperService.authorizeUser(body, AUTH_LOGIN).subscribe({
      next: (res: any) => {
        if (this.httpService.isSuccess(res.body.success)) {
          if (res.body.data && res.body.data.passwordResetRequestId) {
            this.router.navigate([routes.RESET_PASSWORD], {
              queryParams: { requestId: res.body.data.passwordResetRequestId }
            });
          }
          else {
            const data = { ...res.body, setPasswordNavigationType: SET_PASSWORD_NAVIGATION_TYPE.LOGIN }
            if (this.authService.authUser) {
              this.authService.doAuthLogin(data)
            }
            else {
              this.authService.doLogin(data)
            }
          }
        }
        this.isLoading = false;
      },
      error: (e: Error) => {
        console.error(e);
        this.isLoading = false;
      },
    })
  }

  async resetPassword() {
    if (this.email.invalid) {
      this.snackbarService.openSnack("Invalid email!");
      return;
    }

    this.isLoading = true;

    try {
      const res: any = await this.apiHelperService.getForgotPassword(this.email.value);
      this.isLoading = false;
      if (this.httpService.isSuccess(res.success)) {
        this.forgotPasswordToken = res.data.token;
        this.VIEW_TYPE = this.VERIFY_OTP;
        this.startOtpTimer();
      }
    } catch (e) {
      this.isLoading = false;
    }
  }


  startOtpTimer(): void {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }

    this.otpRemainingTime = this.otpDuration;
    this.canResendOtp = false;
    this.updateOtpTimerDisplay();

    this.otpInterval = setInterval(() => {
      this.otpRemainingTime--;

      this.updateOtpTimerDisplay();

      if (this.otpRemainingTime <= 0) {
        clearInterval(this.otpInterval);
        this.canResendOtp = true;
        this.otpTimerDisplay = '00:00';
      }
    }, 1000);
  }

  goToInternalLogin(): void {
    this.router.navigate([routes.INTERNAL_LOGIN]);
  }

  goToExternalLogin(): void {
    this.router.navigate([routes.EXTERNAL_LOGIN]);
  }


  updateOtpTimerDisplay(): void {
    const minutes = Math.floor(this.otpRemainingTime / 60);
    const seconds = this.otpRemainingTime % 60;

    this.otpTimerDisplay =
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}s`;
  }



  verifyOtp() {
    let otpValue = '';

    for (const otp of this.otpArray) {
      const ctrl = this.loginForm.get(`otp${otp}`);
      if (!ctrl?.value) {
        this.snackbarService.openSnack("Please enter OTP");
        return;
      }
      otpValue += ctrl.value;
    }

    const body = {
      otp: otpValue,
      forgotPasswordToken: this.forgotPasswordToken,
      platform: this.authService.platform
    };

    this.isLoading = true;

    this.apiHelperService.authorizeUser(body, AUTH_LOGIN).subscribe({
      next: (res: any) => {
        if (this.httpService.isSuccess(res.body.success)) {
          const data = { ...res.body, setPasswordNavigationType: SET_PASSWORD_NAVIGATION_TYPE.FORGOT_PASSWORD }
          this.authService.doLogin(data);
        }
        this.isLoading = false;
      },
      error: (e) => {
        this.isLoading = false;
        console.error(e)
        // this.snackbarService.openSnack("Invalid OTP");
      }
    });
  }
  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pasteData = event.clipboardData?.getData('text') || '';
    const digits = pasteData.replace(/\D/g, '').slice(0, this.otpArray.length);

    if (!digits.length) {
      return;
    }
    this.otpArray.forEach(i => {
      this.loginForm.get(`otp${i}`)?.setValue('');
    });

    digits.split('').forEach((digit, index) => {
      this.loginForm.get(`otp${index}`)?.setValue(digit);
    });
    const focusIndex =
      digits.length < this.otpArray.length
        ? digits.length
        : this.otpArray.length - 1;

    this.otpInputs.get(focusIndex)?.nativeElement.focus();
  }


  async resendLink() {
    if (this.email.invalid) {
      this.snackbarService.openSnack("Invalid email!");
      return;
    }

    this.isLoading = true;

    try {
      const res = await this.apiHelperService.resetPassword(this.email.value);
      this.isLoading = false;

      if (this.httpService.isSuccess(res.success)) {
        this.VIEW_TYPE = this.RESEND_LINK;
      }
    } catch (e) {
      this.isLoading = false;
    }
  }


  async handleBackToLogin() {
    this.VIEW_TYPE = this.LOGIN;
  }

  // verifyOtp() {
  //   let otpValue: string = '';

  //   for (const otp of this.otpArray) {
  //     let otpControl = this.loginForm.get(`otp${otp}`);
  //     if (otpControl?.invalid || !otpControl?.value) {
  //       this.snackbarService.openSnack("Please enter a valid OTP.");
  //       return;
  //     }
  //     otpValue += otpControl.value;
  //   }

  //   const body = {
  //     "otp": otpValue,
  //   };

  //   this.isLoading = true;
  //   this.apiHelperService.authorizeUser(body, AUTH_VERIFY_OTP).subscribe({
  //     next: (res: any) => {
  //       this.isLoading = false;
  //       if (this.httpService.isSuccess(res.success)) {
  //         this.VIEW_TYPE = this.UPDATE_PASSWORD;
  //       }
  //     },
  //     error: (e: Error) => {
  //       this.isLoading = false;
  //       console.error(e);
  //       this.snackbarService.openSnack("Invalid OTP.");
  //     },
  //   });
  // }

  resendOtp() {
    if (this.email.invalid) {
      this.snackbarService.openSnack("Invalid form!");
      return;
    }

    const body = {
      "email": this.email.value,
    };

    this.isLoading = true;
    this.apiHelperService.authorizeUser(body, AUTH_RESEND_OTP).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (this.httpService.isSuccess(res.success)) {
          this.snackbarService.openSnack("OTP sent again.");
        }
      },
      error: (e: Error) => {
        this.isLoading = false;
        console.error(e);
      },
    });
  }

  updatePassword() {
    if (this.password.invalid || this.confirmPassword.invalid) {
      this.snackbarService.openSnack("Invalid form!");
      return;
    }

    const body = {
      "oldPassword": this.password.value,
      "newPassword": this.confirmPassword.value,
    };

    this.isLoading = true;
    this.apiHelperService.authorizeUser(body, AUTH_UPDATE_PASSWORD).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (this.httpService.isSuccess(res.success)) {
          this.VIEW_TYPE = this.SUCCESS_RESET_PASSWORD;
        }
      },
      error: (e: Error) => {
        this.isLoading = false;
        console.error(e);
      },
    });
  }


  returnLogin() {
    this.email.setValue('')
    this.password.setValue('')
    this.VIEW_TYPE = LOGIN
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  get emailErrorMessage() {
    if (this.email.hasError('required')) {
      return "Email is required";
    }
    if (this.email.hasError('pattern')) {
      return 'Invalid email id';
    }
    return '';
  }

  get confirmPasswordErrorMessage() {
    if (this.confirmPassword.hasError('required')) {
      return "Password is required";
    }
    if (this.confirmPassword.hasError('pattern')) {
      return 'Password must be at least 8 characters with one uppercase, one lowercase, one digit, and one special character';
    }
    return '';
  }

  get displayEmail() {
    return this.email.value ? this.email.value : ''
  }

  setViewType() {
    const state = history.state;
    if (state.key == NAVIGATION_TYPE.FORGOT_PASSWORD) {
      this.onclickForgotPassword()
    }
  }
}
