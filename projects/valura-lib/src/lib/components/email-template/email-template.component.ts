import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy, SimpleChanges, OnChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatOptionModule,
    MatIconModule
  ],
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.scss']
})
export class EmailTemplateComponent implements OnInit, OnDestroy {
  @ViewChild('editableContent', { static: false }) editableContent!: ElementRef;

  @Input() emailTemplateForm!: FormGroup;
  @Input() renderedContent: string = '';
  @Input() templateLoading: boolean = false;
  @Input() protectedVariables: string[] = [];
  @Input() recipientEmail: string = '';
  @Input() showReceipientDropdown: boolean = false;
  @Input() recipientEmailOptions: any[] = [];

  @Output() contentChange = new EventEmitter<any>();
  @Output() keyDown = new EventEmitter<KeyboardEvent>();
  @Output() recipientEmailChange = new EventEmitter<string>();

  isBoldActive: boolean = false;
  isItalicActive: boolean = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Initialize component
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRecipientChange(email: string): void {
    let recipientName = '';
    for (const group of this.recipientEmailOptions) {
      const option = group.options.find((opt: any) => opt.value === email);
      if (option) {
        recipientName = option.name;
        break;
      }
    }
    this.replaceSingleDataVariable('DataSubjectName', recipientName)
  }

  get recipientEmailControl(): FormControl {
    return this.emailTemplateForm?.get('recipientEmail') as FormControl;
  }

  get outerHtmlContent(): FormControl {
    return this.emailTemplateForm?.get('outerHtmlContent') as FormControl;
  }

  get emailContent(): FormControl {
    return this.emailTemplateForm?.get('content') as FormControl;
  }

  onContentChange() {
    if (this.editableContent) {
      this.getSkeleton(this.renderedContent);
      const content = this.editableContent.nativeElement.innerHTML;

      let processedContent = content;
      this.protectedVariables.forEach(variable => {
        const regex = new RegExp(`<span class="(.*?)" data-variable="${variable}" contenteditable="false">(.*?)</span>`, 'g');
        processedContent = processedContent.replace(regex,
          `<span class="$1" data-variable="${variable}" contenteditable="false">$2</span>`);
      });

      this.emailTemplateForm.patchValue({ content: processedContent });
    }
    this.checkFormattingState();
    this.contentChange.emit();
  }

  onKeyDown(event: KeyboardEvent) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    // Check if we're inside a protected template variable
    let currentNode = container.nodeType === 3 ? container.parentNode : container;
    while (currentNode && currentNode !== this.editableContent?.nativeElement) {
      if (currentNode instanceof Element &&
        currentNode.classList.contains('template-variable')) {
        // Only allow navigation keys
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          return;
        }
      }
      currentNode = currentNode.parentNode;
    }

    // Handle delete/backspace near template variables more carefully
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Let the default behavior happen, but then process content after a short delay
      setTimeout(() => {
        this.onContentChange();
      }, 10);
      return;
    }

    this.keyDown.emit(event);
  }

  formatText(command: string) {
    document.execCommand(command, false, '');
    this.editableContent.nativeElement.focus();
    this.onContentChange();
  }

  checkFormattingState() {
    this.isBoldActive = document.queryCommandState('bold');
    this.isItalicActive = document.queryCommandState('italic');
  }

  get emailSubject(): FormControl {
    return this.emailTemplateForm.get('subject') as FormControl;
  }


  replaceSingleDataVariable(variable: string, recipientName: string,) {
    if (this.editableContent) {
      const content = this.emailContent?.value ?? ''
      const regex = new RegExp(
        `<span class="(.*?)" data-variable="${variable}" contenteditable="false">(.*?)</span>`,
        'g'
      );
      const processedContent = content.replace(
        regex,
        `<span class="$1" data-variable="${variable}" contenteditable="false">${recipientName}</span>`
      );
      this.renderedContent = processedContent
      this.emailTemplateForm.patchValue({ content: processedContent });
      this.checkFormattingState();
      this.contentChange.emit();
    }
  }

  getSkeleton(html: string) {
    if (this.outerHtmlContent?.value) {
      return
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.body.innerHTML = "";
    const outerHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    this.outerHtmlContent.setValue(outerHtml)
  }
}
