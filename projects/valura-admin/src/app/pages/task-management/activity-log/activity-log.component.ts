import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityLogUI } from '../constant';
import { ItemNotFoundComponent } from '@valura-lib/components/item-not-found/item-not-found.component';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, ItemNotFoundComponent],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss'
})
export class ActivityLogComponent {

  @Input() activityLogs: ActivityLogUI[] = [];
  @Input() initialLoading = false;
  @Input() activityLogVisibility = false;

}