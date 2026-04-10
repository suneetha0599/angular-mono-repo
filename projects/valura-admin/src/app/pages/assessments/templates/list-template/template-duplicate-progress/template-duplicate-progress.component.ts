import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from "@angular/material/progress-bar";

@Component({
  selector: 'app-template-duplicate-progress',
  imports: [MatProgressBarModule, MatDialogModule],
  templateUrl: './template-duplicate-progress.component.html',
  styleUrl: './template-duplicate-progress.component.scss'
})
export class TemplateDuplicateProgressComponent {
  progress: number = 0;
}
