import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import { MatTableModule } from '@angular/material/table';
import { routes as routeConstants } from '@admin-core/constants/routes';

@Component({
  selector: 'app-consent-details',
  imports: [CommonModule, ReactiveFormsModule, MatTabsModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, RouterModule, LoadingButtonComponent, MatTableModule],
  templateUrl: './consent-details.component.html',
  styleUrl: './consent-details.component.scss'
})
export class ConsentDetailsComponent {
  constructor(private router: Router) { }

  tabOptions = ['purposeDetails', 'Adddocument'];
  selectedTab = 'purposeDetails';
  selectedTabIndex = 0
  currentPath: string = '';

  ngOnInit(): void {
    this.onInitPage()
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTab = this.tabOptions[event.index];
  }
  requestItems = [
    { source: 'ABC', type: 'Internal', status: 'Completed', attributes: 27 },
    { source: 'CDE', type: 'Third party', status: 'Pending', attributes: 36 },
    { source: 'EFG', type: 'htht', status: 'Legal', attributes: 19 },
    { source: 'HIJ', type: 'two', status: 'Needs review', attributes: 33 },
    { source: 'KLM', type: 'one', status: 'Completed', attributes: 22 },
  ];

  viewTerms() {
    this.router.navigate([`${this.currentPath}/${routeConstants.CONSENT_TERM_PAGE}`])
  }


  onInitPage() {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }
}
