import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  NgZone,
  Optional,
  SimpleChanges
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[appEllipsisTooltip]'
})
export class EllipsisTooltipDirective implements AfterViewInit {
  @Input('appEllipsisTooltip') text = '';
  @Input() maxWidth: string | number = '100%';
  @Input() colorType: 'primary' | 'default' = 'default';
  @Input() enableNumberSplit = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private ngZone: NgZone,
    @Optional() private matTooltip?: MatTooltip
  ) { }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['text']) {
      this.applyEllipsis();
    }
  }
  ngAfterViewInit() {
    this.applyEllipsis();
  }

  private applyEllipsis() {
    const el = this.el.nativeElement;

    Object.assign(el.style, {
      display: 'inline-block',
      maxWidth: `${this.maxWidth ? `${this.maxWidth}px` : ``}`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      verticalAlign: 'bottom',
      cursor: this.colorType === 'primary' ? 'pointer' : 'default',
      color: this.colorType === 'primary' ? '#1C2B70' : '#333',
      fontWeight: this.colorType === 'primary' ? '500' : '400'
    });

    const value = (this.text ?? '').toString().trim();
    let cellText = value.replace(/\r?\n|\r/g, ' ').trim();
    let tooltipText = cellText;

    if (this.enableNumberSplit) {
      tooltipText = value
        .replace(/\r?\n|\r/g, ' ')
        .replace(/(\d+\.)\s*/g, '\n$1 ')
        .replace(/(\([a-z]\))/g, '\n$1 ')
        .trim();
    }
    
    el.innerText = cellText || '-';

    if (this.matTooltip) {
      this.matTooltip.message = tooltipText || '-';
      this.matTooltip.tooltipClass = 'multiline-tooltip';
    }

    this.ngZone.runOutsideAngular(() => {
      const check = () => {
        const isTruncated = el.scrollWidth > el.clientWidth;
        if (this.matTooltip) this.matTooltip.disabled = !isTruncated;
      };
      requestAnimationFrame(check);
      new ResizeObserver(check).observe(el);
    });
  }
}

