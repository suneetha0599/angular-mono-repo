import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return this.sanitizer.bypassSecurityTrustHtml('');

    const clean = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'span', 'a',
        'ul', 'ol', 'li', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'img',
      ],
      ALLOWED_ATTR: ['style', 'href', 'target', 'src', 'alt', 'class'],
      ALLOWED_URI_REGEXP: /^https?:\/\//i,
    });

    const processed = clean.replace(/<p([^>]*)><\/p>/g, '<p$1>&nbsp;</p>');

    return this.sanitizer.bypassSecurityTrustHtml(processed);
  }
}
