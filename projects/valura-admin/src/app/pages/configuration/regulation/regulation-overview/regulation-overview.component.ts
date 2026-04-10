import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-regulation-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './regulation-overview.component.html',
  styleUrls: ['./regulation-overview.component.scss']
})
export class RegulationOverviewComponent {
  @Input() regulationDetails: any;

}
