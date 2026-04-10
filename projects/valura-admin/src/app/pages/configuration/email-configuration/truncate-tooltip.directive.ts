import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[appTruncateTooltip]',
  standalone: true
})
export class TruncateTooltipDirective implements OnInit {
  constructor(
    private elementRef: ElementRef,
    private matTooltip: MatTooltip
  ) {}

  ngOnInit() {
   
    this.matTooltip.disabled = true;
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    const element = this.elementRef.nativeElement;
    const isOverflowing = element.scrollWidth > element.offsetWidth;
    
    this.matTooltip.disabled = !isOverflowing;
    
 
    if (!this.matTooltip.disabled) {
      this.matTooltip.show();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.matTooltip.hide();
    this.matTooltip.disabled = true;
  }
}
