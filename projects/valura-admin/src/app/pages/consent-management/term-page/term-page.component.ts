import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { QuillModule } from 'ngx-quill';


@Component({
  selector: 'app-term-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingButtonComponent, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, RouterModule, QuillModule
  ],
  templateUrl: './term-page.component.html',
  styleUrl: './term-page.component.scss'
})
export class TermPageComponent implements OnInit, OnDestroy {
  purposeForm: FormGroup;
  inputTypes = ['Check box (Opt in/ Opt out)', 'Toggle', 'Radio button', 'Email verification', 'OTP verification'];
  tabOptions = ['Add content', 'Add document', 'Add links'];
  selectedTab = 'Add content';
  termForm: FormGroup | undefined;



  constructor(private fb: FormBuilder, private router: Router, private location: Location) {
    this.purposeForm = this.fb.group({
      title: [''],
      description: [''],
      expiry: [''],
      inputType: [],
      mandatory: [true],
      applyPolicy: [true],
      termContent: ['']
    });

    this.termForm = this.fb.group({
      termDescription: ['']
    });
  }

  ngOnInit(): void { }

  ngOnDestroy(): void { }

  onSubmit() {
    console.log(this.purposeForm.value);
  }

  selectInputType(type: string) {
    this.purposeForm.patchValue({ inputType: type });
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  goBack() {
    this.location.back();
  }

  handleFileUpload($event: Event) {

  }
}
