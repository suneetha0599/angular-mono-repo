import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[splitByDirectives]',
  standalone: true
})

export class SplitByDirectivesDirective implements OnChanges {
  @Input('splitByDirectives') text: string = '';
  @Input() splitType: 'alpha' | 'number' = 'alpha';

  constructor(private el: ElementRef<HTMLElement>) { }

  ngOnChanges() {
    if (!this.text) {
      this.el.nativeElement.innerText = '-';
      return;
    }

    const regex =
      this.splitType === 'number'
        ? /(?=\d+\.\s*|\([a-zA-Z]\))/g 
        : /(?=\([a-zA-Z]\))/g;

    const lines = this.text
      .split(regex)
      .map(line => line.trim())
      .filter(Boolean);

    this.el.nativeElement.innerHTML = lines.join('<br />');
  }
}
