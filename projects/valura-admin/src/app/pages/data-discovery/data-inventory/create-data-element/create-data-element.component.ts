import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';

interface DataType {
  name: string;
  sensitivity: 'Low' | 'Mid' | 'High';
  selected: boolean;
}
@Component({
  selector: 'app-create-data-element',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatLabel, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, RouterModule,
    MatButtonModule, MatCheckboxModule, TextFieldModule, MatTooltipModule, LoadingButtonComponent, MatDrawer, MatDrawerContainer
  ],
  templateUrl: './create-data-element.component.html',
  styleUrl: './create-data-element.component.scss'
})
export class CreateDataElementComponent {

  purposeForm: FormGroup;
  options = ['employee', 'employeer'];
  inputTypes = ['Check box (Opt in/ Opt out)', 'Toggle', 'Radio button', 'Email verification', 'OTP verification'];
  isDrawerOpen = false;
  drawerOpen = false;
  categories = ['Personal identifiers', 'Financial information'];
  selectedCategory = this.categories[0];

  constructor(private fb: FormBuilder, private dialog: MatDialog, private router: Router) {
    this.purposeForm = this.fb.group({
      title: [''],
      description: [''],
      expiry: [''],
      inputType: ['Check box (Opt in/ Opt out)'],
      mandatory: [true],
      applyPolicy: [true]
    });
  }

  closeDrawer() {
    this.drawerOpen = false;
  }

  dataElements: Record<string, DataType[]> = {
    'Personal identifiers': [
      { name: 'Name', sensitivity: 'Low', selected: true },
      { name: 'Phone number', sensitivity: 'Mid', selected: false },
    ],
    'Financial information': [
      { name: 'Bank account number', sensitivity: 'Low', selected: true },
      { name: 'Statement', sensitivity: 'Mid', selected: false },
    ]
  };
}
