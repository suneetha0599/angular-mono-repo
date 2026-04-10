import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-trigger-detail-drawer',
  imports: [MatIconModule],
  templateUrl: './trigger-detail-drawer.component.html',
  styleUrl: './trigger-detail-drawer.component.scss'
})
export class TriggerDetailDrawerComponent {
  @Output() onCloseDrawer = new EventEmitter<void>();
  @Input() triggers: any;
  save() {
    throw new Error('Method not implemented.');
  }
  close() {
    this.onCloseDrawer.emit();
  }

}
