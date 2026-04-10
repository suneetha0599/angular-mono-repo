import { Component, EventEmitter, inject, Input, NgModule, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '@admin-core/services/auth.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { Router } from '@angular/router';
import { User } from '@admin-core/models/user.model';
import { UserService } from '@admin-core/services/user/user.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';

@Component({
  selector: 'app-user-profile',
  imports: [MatIconModule, MatFormFieldModule, MatButtonModule, MatInputModule, MatSelectModule, MatLabel, LoadingButtonComponent,
    FormsModule, MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule, CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
  @Output() toggle = new EventEmitter<void>();
  @Input() isCollapsed = false;

  userInfoForm!: FormGroup;
  loading: boolean = false;
  entityList: any[] = []
  private authService = inject(AuthService);
  private apiHelperService = inject(ApiHelperService);
  private router = inject(Router);
  private userService = inject(UserService);

  constructor(private fb: FormBuilder) { }

  async ngOnInit(): Promise<void> {
    this.userInfoForm = this.fb.group({
      displayName: [''],
      phoneNumber: [''],
      profilePhoto: [''],
      email: [''],
      defaultEntity: [''],
      firstName: [''],
      lastName: ['']
    });
    await this.loadEntityList()
    this.userInfo()
  }

  async loadEntityList() {
    this.entityList = this.authService.getEntityList() || []
  }

  logOut() {
    this.authService.logOut()
  }

  get displayName() {
    return this.userInfoForm.get('displayName')?.value
  }

  get firstName() {
    return this.userInfoForm.get('firstName')?.value
  }
  get lastName() {
    return this.userInfoForm.get('lastName')?.value
  }

  get phoneNumber() {
    return this.userInfoForm.get('phoneNumber')?.value
  }

  get email() {
    return this.userInfoForm.get('email')?.value
  }

  get profilePhoto() {
    return this.userInfoForm.get('profilePhoto')?.value
  }

  onCancel() {
    this.router.navigate(['..']);
  }

  onSave() {
    const payload = {
      displayName: this.displayName,
      phoneNumber: this.phoneNumber,
      active: true,
      defaultEntity: this.userInfoForm.get('defaultEntity')?.value,
      firstName: this.firstName,
      lastName: this.lastName
    };

    this.loading = true;

    this.apiHelperService.saveUserInfo(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res: User) => {
          this.authService.setUserInfo(res);

          this.userInfoForm.patchValue({
            displayName: res.displayName || '',
            phoneNumber: res.phoneNumber || '',
            email: res.email || '',
            profilePhoto: res.profilePhoto || '',
            firstName: res.firstName,
            lastName: res.lastName
          });

          this.userService.profileUpdated$.next(res);
          this.userService.updateUserDetailsToDb(res.applicationUserId, res);
        },
        error: (e) => {
          console.error(e);
        }
      });
  }



  async userInfo() {
    const userData = await this.apiHelperService.getUserInfo();
    if (userData) {
      this.userInfoForm.patchValue({
        displayName: userData.displayName || '',
        phoneNumber: userData.phone || '',
        email: userData.email || '',
        profilePhoto: userData.profilePhoto || '',
        defaultEntity: userData.defaultEntity[0] || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || ''
      });
    }
  }

}
