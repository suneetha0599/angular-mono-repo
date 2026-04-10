import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-risk-table-shimmer',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule
  ],
  templateUrl: './risk-table-shimmer.component.html',
  styleUrls: ['./risk-table-shimmer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskTableShimmerComponent {
}