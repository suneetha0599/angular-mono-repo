import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatLabel, MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { DRAWER_SELECTION, DRAWER_SUMMARY } from '../../constants';

interface DataType {
  name: string;
  sensitivity: 'Low' | 'Mid' | 'High';
  selected: boolean;
}

@Component({
  selector: 'consent-drawer-content',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatLabel, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, RouterModule,
    MatButtonModule, MatCheckboxModule, LoadingButtonComponent
  ],
  templateUrl: './consent-drawer-content.component.html',
  styleUrl: './consent-drawer-content.component.scss'
})
export class ConsentDrawerContentComponent {

  @Input() drawerType: string = DRAWER_SELECTION;
  @Output() onCloseDrawer = new EventEmitter<any>()

  DRAWER_SELECTION = DRAWER_SELECTION;

  constructor() { }


  categories = ['Personal identifiers', 'Financial information'];
  selectedCategory = this.categories[0];

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

  get totalSelected(): number {
    return Object.values(this.dataElements)
      .flat()
      .filter(el => el.selected).length;
  }

  goToSummary() {
    this.drawerType = DRAWER_SUMMARY;
  }

  goBack() {
    this.drawerType = DRAWER_SELECTION
  }

  isCategorySelected(cat: string) {
    return this.dataElements[cat]?.some(el => el.selected);
  }

  close() {
    this.onCloseDrawer.emit(true)
  }
}
