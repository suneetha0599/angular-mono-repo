import { Component, Input, inject } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
@Component({
  selector: 'app-assessment-approvers-details',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatDialogModule],
  templateUrl: './assessment-approvers-details.component.html',
  styleUrls: ['./assessment-approvers-details.component.scss']
})
export class AssessmentApproversDetailsComponent {

  @Input() approverData: any;

  drawer = inject(MatDrawer);

  closeDrawer() {
    this.drawer.close();
  }
}