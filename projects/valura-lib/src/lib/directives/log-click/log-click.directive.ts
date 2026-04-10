import { Directive, Input, HostListener, inject } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

@Directive({
  selector: '[appLogClick]',
  standalone: true
})
export class LogClickDirective {
  @Input('appLogClick') buttonName: string = 'Unknown Button';
  
  private logger = inject(NGXLogger);

  // @HostListener('click')
  @HostListener('onButtonClick')
  onClick() {
    this.logger.info(`Action: Button Clicked - [${this.buttonName}]`);
  }
}