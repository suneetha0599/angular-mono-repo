import { Component, Input } from '@angular/core';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';

@Component({
  selector: 'item-not-found',
  imports: [],
  templateUrl: './item-not-found.component.html',
  styleUrl: './item-not-found.component.scss'
})
export class ItemNotFoundComponent {

  @Input() imgHeight: string = ""

  @Input() mainheading: string = "Item Not Found";

  @Input() heading: string = "This body copy explains the empty state";
}
