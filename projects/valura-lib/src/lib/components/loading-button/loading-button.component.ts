import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule, TooltipPosition } from '@angular/material/tooltip';

@Component({
  selector: 'loading-button',
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule,],
  templateUrl: './loading-button.component.html',
  styleUrl: './loading-button.component.scss'
})
export class LoadingButtonComponent {

  readonly TYPE_PRIMARY = 'primary'
  readonly TYPE_SECONDARY = 'secondary'
  readonly TYPE_LIGHT = 'light'
  readonly TYPE_PRIMARY_WITH_MATTOOLTIP = 'primary_mattolltip'

  @Input() loading: boolean = false
  @Input() disabled: boolean = false
  @Input() loadingText: string = 'Loading...'
  @Input() type: string = this.TYPE_PRIMARY
  @Input() isSubmitButton: boolean = false
  @Input() isFullWidth: boolean = false
  @Input() isIconButton: boolean = false
  @Input() basicButton: boolean = false
  @Input() smallButton: boolean = false
  @Input() showSpinnerOnly: boolean = false
  @Input() matTooltip: string = '';
  @Input() matTooltipPosition: TooltipPosition = 'right';
  @Input() isIconOnlyButton: boolean = false

  @Output() onButtonClick = new EventEmitter()

  onClick() {
    this.onButtonClick.next(1)
  }
}
