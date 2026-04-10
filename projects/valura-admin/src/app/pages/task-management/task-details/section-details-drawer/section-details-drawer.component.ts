import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { DiscussionLogComponent } from "../discussion-log/discussion-log.component";

@Component({
  selector: 'app-section-details-drawer',
  imports: [MatIconModule, MatCardModule, DiscussionLogComponent],
  templateUrl: './section-details-drawer.component.html',
  styleUrl: './section-details-drawer.component.scss'
})
export class SectionDetailsDrawerComponent {
  @Output() onCloseDrawer = new EventEmitter<void>();
  @Input() requestId = 0;
  @Input() questionDetail: any = null;

  close() {
    this.onCloseDrawer.emit();
  }
}
