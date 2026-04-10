import { Component, ViewChildren, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { LeftPanelLoginPageComponent } from '@valura-lib/components/left-panel-login-page/left-panel-login-page.component';
import { FooterComponenetComponent } from "@valura-lib/components/footer-component/footer-componenet.component";
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { AuthService } from '@admin-core/services/auth.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { IdpConfig } from '../login/login.component';
import { SSO_INTERNAL_AUTH } from '@admin-core/constants/constants';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-internal-login',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgClass,
    LeftPanelLoginPageComponent,
    FooterComponenetComponent,
    LoadingButtonComponent
  ],
  templateUrl: './internal-login.component.html',
  styleUrl: './internal-login.component.scss'
})
export class InternalLoginComponent implements OnInit {
  step1Form!: FormGroup;
  userSessionVerified: boolean = false;
  showOtp = false;
  otpTimer = 120;
  otpTimerDisplay = '02:00';
  otpInterval: any;
  verifyUserIsLoading: boolean = false;
  otpVerifiedLoading: boolean = false;
  focusedOtpIndex = -1;
  sendOtpRequested = false;
  isLoading = false;
  isOTpTimer = false;
  idpConfigs: IdpConfig[] = [];
  emailRegex: string = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';

  private apiHelperService = inject(ApiHelperService);
  private authService = inject(AuthService);
  private snackbarService = inject(SnackbarService);

  @ViewChildren('otpInput') otpInputs!: any;

  constructor(
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadIdpConfig();
    this.step1Form = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(this.emailRegex)]],
      otp0: [''],
      otp1: [''],
      otp2: [''],
      otp3: ['']
    });
  }

  get email() {
    return this.step1Form.get('email') as FormControl;
  }

  get otpControlsValid() {
    const { otp0, otp1, otp2, otp3 } = this.step1Form.value;
    return [otp0, otp1, otp2, otp3].every(val => val && /^\d$/.test(val));
  }

  get isVerifyEnabled(): boolean {
    return this.email?.valid;
  }

  get isResendDisabled(): boolean {
    return this.verifyUserIsLoading || this.otpTimer > 2;
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
      path: SSO_INTERNAL_AUTH,
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

  verifyUser() {
    if (this.email.invalid) return;
    this.verifyUserIsLoading = true;
    this.apiHelperService.verifyInternalUserSession({ email: this.email.value }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.authService.setRequestId(res.data.token);
          this.showOtp = true;
          this.sendOtpRequested = true;
          this.startOtpTimer();
          setTimeout(() => {
            if (this.otpInputs && this.otpInputs.first) {
              this.otpInputs.first.nativeElement.focus();
            }
          }, 100);
          // this.snackbarService.openSnack("OTP sent to your email!");
        } else {
          this.snackbarService.openSnack("Failed to send OTP. Please try again.");
        }
        this.verifyUserIsLoading = false;
      },
      error: (error: Error) => {
        this.verifyUserIsLoading = false;
        const errorMsg = error.message || "Failed to send OTP. Please try again.";
        this.snackbarService.openSnack(errorMsg);
        if (errorMsg.includes('network') || errorMsg.includes('Internet')) {
          this.snackbarService.openSnack("Network error. Please check your connection.");
        }
      }
    });
  }

  verifyOtp() {
    if (!this.otpControlsValid) {
      this.snackbarService.openSnack("Please enter a valid OTP.");
      return;
    }

    this.otpVerifiedLoading = true;

    const { otp0, otp1, otp2, otp3 } = this.step1Form.value;
    const otp = `${otp0}${otp1}${otp2}${otp3}`;
    const requestId = this.authService.getRequestId();
    const queryParams = this.authService.getEntryCode();
    const body: any = {
      "otp": otp,
      "token": requestId
    }
    const entityId = queryParams?.entityId ?? '';
    if (entityId) {
      body.entityId = entityId;
    }
    const notificationId = queryParams?.notificationId ?? '';
    if (notificationId) {
      body.notificationId = notificationId;
    }

    this.apiHelperService.validateInternalUserOtp(body).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.authService.internalLogin(res);
          this.userSessionVerified = true;
          this.showOtp = false;
          clearInterval(this.otpInterval);
        } else {
          this.snackbarService.openSnack("Invalid OTP. Please try again.");
        }
        this.otpVerifiedLoading = false;
      },
      error: (error: Error) => {
        this.otpVerifiedLoading = false;
        this.snackbarService.openSnack(error.message || "Failed to verify OTP. Please try again.");
      }
    });
  }

  resendOtp() {
    this.step1Form.patchValue({
      otp0: '', otp1: '', otp2: '', otp3: ''
    });
    clearInterval(this.otpInterval);
    this.verifyUser();
  }

  tryAnotherWay() {
    this.showOtp = false;
    this.otpTimer = 0;
    this.sendOtpRequested = false;
    this.userSessionVerified = false;
    this.isOTpTimer = false;
    this.step1Form.patchValue({
      otp0: '', otp1: '', otp2: '', otp3: ''
    });
    clearInterval(this.otpInterval);
  }

  startOtpTimer() {
    this.otpTimer = 120;
    this.isOTpTimer = true;
    this.updateTimerDisplay();
    if (this.otpInterval) clearInterval(this.otpInterval);

    this.otpInterval = setInterval(() => {
      this.otpTimer--;
      this.updateTimerDisplay();
      if (this.otpTimer <= 0) {
        clearInterval(this.otpInterval);
        this.isOTpTimer = false;
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const min = Math.floor(this.otpTimer / 60);
    const sec = this.otpTimer % 60;
    this.otpTimerDisplay = `${this.pad(min)}:${this.pad(sec)}`;
  }

  pad(n: number) {
    return n < 10 ? '0' + n : '' + n;
  }

  focusNext(index: number, event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (/^[0-9]$/.test(event.key) && index < this.otpInputs.length - 1) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
    }

    if (event.key === 'Backspace' && !value && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
    }

    if (event.key === 'ArrowRight' && index < this.otpInputs.length - 1) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
      event.preventDefault();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
      event.preventDefault();
    }
  }

  handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';
    const digits = pasteData.replace(/\D/g, '').split('').slice(0, 4);

    digits.forEach((digit, index) => {
      const control = this.step1Form.get(`otp${index}`);
      if (control) {
        control.setValue(digit);
      }
      this.otpInputs.get(index)?.nativeElement.focus();
    });
  }
}