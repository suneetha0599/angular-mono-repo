import { AfterViewInit, Directive, ElementRef, EventEmitter, inject, NgZone, Output } from '@angular/core';

@Directive({
  selector: '[contentMeasure]'
})
export class ContentMeasureDirective implements AfterViewInit {
  @Output() size = new EventEmitter<{ width: number; height: number }>();

  private el = inject(ElementRef);
  private zone = inject(NgZone);

  constructor() { }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const el = this.el.nativeElement;

        const width = el.scrollWidth;
        const height = el.scrollHeight;
        this.zone.run(() => {
          this.size.emit({ width, height });
        });
      });
    });
  }
}
