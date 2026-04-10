import { Component } from '@angular/core';
import { TaskDetailsComponent } from '../../task-management/task-details/task-details.component';

@Component({
  selector: 'app-request-task-detail',
  imports: [TaskDetailsComponent],
  templateUrl: './request-task-detail.component.html',
  styleUrl: './request-task-detail.component.scss'
})
export class RequestTaskDetailComponent {

}
