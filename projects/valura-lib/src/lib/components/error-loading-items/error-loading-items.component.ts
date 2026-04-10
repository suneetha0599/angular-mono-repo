import { Component, Input } from '@angular/core';

@Component({
  selector: 'error-loading-items',
  imports: [],
  templateUrl: './error-loading-items.component.html',
  styleUrl: './error-loading-items.component.scss'
})
export class ErrorLoadingItemsComponent {

  @Input() imgHeight: string = ""

  @Input() heading: string = "Error Loading";
}
