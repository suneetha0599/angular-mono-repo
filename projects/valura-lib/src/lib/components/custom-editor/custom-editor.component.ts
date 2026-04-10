import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import { FormsModule } from '@angular/forms';
import Link from '@tiptap/extension-link';

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ''),
        renderHTML: (attributes: any) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`
          };
        }
      }
    };
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      }
    };
  }
});

@Component({
  selector: 'app-custom-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './custom-editor.component.html',
  styleUrl: './custom-editor.component.scss'
})
export class CustomEditorComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('editorContainer') editorContainer!: ElementRef;
  @ViewChild('linkBubbleMenu', { read: ElementRef }) linkBubbleMenu!: ElementRef;

  @Input() placeholder: string = '';
  @Input() initialContent: string = '';
  @Input() showInsertVariable: boolean = false;
  @Input() variables: any[] = [];
  @Input() showLinkInsert: boolean = false;
  @Input() showImageUpload: boolean = false;
  @Input() maxImageSize: number = 5 * 1024 * 1024;
  @Input() autoFocus: boolean = false;

  @Output() imagesSelected = new EventEmitter<{ file: File; tempId: string }[]>();
  @Output() contentChange = new EventEmitter<{ content: string; edited: boolean }>()
  @Output() editorReady = new EventEmitter<Editor>();
  @Output() blur = new EventEmitter<void>();

  editor!: Editor;

  fontFamilies = [
    { label: 'Andale Mono', value: 'Andale Mono' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Arial Black', value: 'Arial Black' },
    { label: 'Book Antiqua', value: 'Book Antiqua' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Impact', value: 'Impact' },
    { label: 'Symbol', value: 'Symbol' },
    { label: 'Tahoma', value: 'Tahoma' },
    { label: 'Terminal', value: 'Terminal' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS' },
    { label: 'Verdana', value: 'Verdana' },
  ];



  fontSizes = [
    { label: '8px', value: '8px' },
    { label: '10px', value: '10px' },
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '28px', value: '28px' },
    { label: '32px', value: '32px' },
    { label: '36px', value: '36px' },
    { label: '48px', value: '48px' }
  ];

  selectedFontFamily = '';
  selectedFontSize = '';

  private readonly DEFAULT_FONT_FAMILY = 'Arial';
  private readonly DEFAULT_FONT_SIZE = '14px';

  showLinkBubble: boolean = false;
  linkBubbleUrl: string = '';
  linkBubblePosition = { top: '0px', left: '0px' };
  showLinkInput: boolean = false;
  linkInputUrl: string = '';
  linkInputPosition = { top: '0px', left: '0px' };
  private savedSelection: any = null;
  private savedLinkSelection: any = null;
  selectedImages: { file: File; tempId: string }[] = [];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() { }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialContent'] && !changes['initialContent'].firstChange) {
      const newContent = changes['initialContent'].currentValue;


      if (this.editor && !(this.editor as any).isDestroyed) {
        const currentContent = this.editor.getHTML();

        if (currentContent !== newContent) {
          this.updateContent(newContent || '<p></p>');
        }
      }
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initEditor(this.initialContent);
    });
  }



  ngOnDestroy() {
    if (this.editor && !(this.editor as any).isDestroyed) {
      try {
        this.editor.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
    }
  }

  private initEditor(content?: string) {
    if (!this.editorContainer?.nativeElement) {
      console.warn('Editor container not available');
      return;
    }

    if (this.editor && !(this.editor as any).isDestroyed) {
      try {
        this.editor.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
    }

    let editorContent = content || '<p><br></p>';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (!textContent.trim()) {
      editorContent = '<p></p>';
    }

    this.editor = new Editor({
      element: this.editorContainer.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: false,
          code: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
          bold: {},
          italic: {},
          strike: {},
        }),
        Extension.create({
          name: 'paragraphIndent',
          addGlobalAttributes() {
            return [
              {
                types: ['paragraph', 'listItem'],
                attributes: {
                  marginLeft: {
                    default: 0,
                    parseHTML: element => {
                      const margin = element.style.marginLeft;
                      return margin ? parseInt(margin.replace('px', '')) : 0;
                    },
                    renderHTML: attributes => {
                      if (!attributes['marginLeft'] || attributes['marginLeft'] === 0) {
                        return {};
                      }
                      return {
                        style: `margin-left: ${attributes['marginLeft']}px`,
                      };
                    },
                  },
                },
              },
            ];
          },
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          alignments: ['left', 'center', 'right', 'justify'],
          defaultAlignment: 'left',
        }),

        FontFamily.configure({
          types: ['textStyle'],
        }),
        FontSize,
        ...(this.showLinkInsert ? [Link.configure({
          openOnClick: false,
          autolink: true,
          protocols: ['filekey'],
          HTMLAttributes: {
            class: 'editor-link filekey-link',
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        })] : []),
        Placeholder.configure({
          placeholder: this.placeholder,
          showOnlyWhenEditable: true,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content: editorContent,
      editorProps: {
        attributes: {
          class: 'tiptap-editor',
          style: 'white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%;',
        },
        handleClick: (view, pos, event) => {
          if (!this.showLinkInsert) return false;

          const target = event.target as HTMLElement;
          const link = target.closest('a');

          if (link) {
            const href = link.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
              event.preventDefault();
              this.showLinkBubbleMenu(link);
              return true;
            }
          }

          this.hideLinkBubble();
          this.hideLinkInput();
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        const edited = editor.isFocused;
        this.contentChange.emit({ content: editor.getHTML(), edited: edited });
      },
      onBlur: () => {
        this.blur.emit();
      },
      onSelectionUpdate: ({ editor }) => {
        this.updateFontSelections();
      },
    });

    setTimeout(() => {
      if (this.editor && !(this.editor as any).isDestroyed) {
        if (this.autoFocus) {
          this.editor.commands.focus();
        }


        this.editor.view.dispatch(
          this.editor.state.tr.setStoredMarks([
            this.editor.schema.marks['textStyle'].create({
              fontFamily: this.DEFAULT_FONT_FAMILY,
              fontSize: this.DEFAULT_FONT_SIZE
            })
          ])
        );

        this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
        this.selectedFontSize = this.DEFAULT_FONT_SIZE;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.updateFontSelections();
          if (!this.selectedFontFamily) {
            this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
          }
          if (!this.selectedFontSize) {
            this.selectedFontSize = this.DEFAULT_FONT_SIZE;
          }
          this.cdr.detectChanges();
        }, 150);
      }

      this.editorReady.emit(this.editor);
    }, 100);
    setTimeout(() => {
      if (this.showLinkInsert) {
        const editorElement = this.editorContainer.nativeElement;
        editorElement.addEventListener('click', (event: MouseEvent) => {
          const target = event.target as HTMLElement;

          if (target.closest('.link-bubble-menu') || target.closest('.link-input-inline')) {
            return;
          }

          const link = target.closest('a');
          if (!link) {
            this.hideLinkBubble();
            this.hideLinkInput();
            this.cdr.detectChanges();
          }
        });
      }
    }, 100);
  }

  formatVariableName(variable: string): string {
    return variable
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  undo(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().undo().run();
  }

  redo(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().redo().run();
  }

  canUndo(): boolean {
    if (!this.editor || (this.editor as any).isDestroyed) return false;
    return this.editor.can().undo();
  }

  canRedo(): boolean {
    if (!this.editor || (this.editor as any).isDestroyed) return false;
    return this.editor.can().redo();
  }

  toggleBold(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleBold().run();
    this.cdr.detectChanges();
  }

  toggleItalic(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleItalic().run();
    this.cdr.detectChanges();
  }

  toggleUnderline(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleUnderline().run();
    this.cdr.detectChanges();
  }

  setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify'): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().setTextAlign(alignment).run();
    this.cdr.detectChanges();
  }

  toggleBulletList(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleBulletList().run();
    this.cdr.detectChanges();
  }

  toggleOrderedList(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    this.editor.chain().focus().toggleOrderedList().run();
    this.cdr.detectChanges();
  }

  indent(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;

    const MAX_INDENT = 480;

    if (this.isActive('bulletList') || this.isActive('orderedList')) {
      const attrs = this.editor.getAttributes('listItem');
      const currentMargin = parseInt(attrs['marginLeft']) || 0;

      if (currentMargin < MAX_INDENT) {
        this.editor.chain().focus().updateAttributes('listItem', {
          marginLeft: currentMargin + 30
        }).run();
      }
    } else {
      const attrs = this.editor.getAttributes('paragraph');
      const currentMargin = parseInt(attrs['marginLeft']) || 0;

      if (currentMargin < MAX_INDENT) {
        this.editor.chain().focus().updateAttributes('paragraph', {
          marginLeft: currentMargin + 30
        }).run();
      }
    }

    this.cdr.detectChanges();
  }

  outdent(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;

    if (this.isActive('bulletList') || this.isActive('orderedList')) {
      const attrs = this.editor.getAttributes('listItem');
      const currentMargin = parseInt(attrs['marginLeft']) || 0;

      if (currentMargin > 0) {
        const newMargin = Math.max(0, currentMargin - 30);
        this.editor.chain().focus().updateAttributes('listItem', {
          marginLeft: newMargin
        }).run();
      }
    } else {
      const attrs = this.editor.getAttributes('paragraph');
      const currentMargin = parseInt(attrs['marginLeft']) || 0;

      if (currentMargin > 0) {
        const newMargin = Math.max(0, currentMargin - 30);
        this.editor.chain().focus().updateAttributes('paragraph', {
          marginLeft: newMargin
        }).run();
      }
    }

    this.cdr.detectChanges();
  }

  onFontFamilyChange(fontFamily: string): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;

    if (fontFamily) {
      this.editor.chain().focus().setFontFamily(fontFamily).run();
    } else {
      this.editor.chain().focus().unsetFontFamily().run();
    }
    this.selectedFontFamily = fontFamily;
    this.cdr.detectChanges();
  }

  onFontSizeChange(fontSize: string): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;

    if (fontSize) {
      this.editor.chain().focus().setFontSize(fontSize).run();
    } else {
      this.editor.chain().focus().unsetFontSize().run();
    }
    this.selectedFontSize = fontSize;
    this.cdr.detectChanges();
  }

  getFontFamilyLabel(value: string): string {
    if (!value) return 'Font';
    const match = this.fontFamilies.find(f => f.value === value);
    return match ? match.label : value;
  }

  getFontSizeLabel(value: string): string {
    if (!value) return 'Size';
    const size = this.fontSizes.find(s => s.value === value);
    return size ? size.label : 'Size';
  }

  private normalizeFontFamily(font: string): string {
    if (!font) return '';
    return font.replace(/['"]/g, '').split(',')[0].trim();
  }

  private updateFontSelections(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;
    try {
      const attributes = this.editor.getAttributes('textStyle');
      const rawFont = attributes['fontFamily'];
      if (rawFont) {
        const normalized = this.normalizeFontFamily(rawFont);
        const match = this.fontFamilies.find(f => f.value === normalized);
        this.selectedFontFamily = match ? match.value : normalized;
      } else {
        this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
      }
      this.selectedFontSize = attributes['fontSize'] || this.DEFAULT_FONT_SIZE;
      this.cdr.detectChanges();
    } catch (error) {
      this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
      this.selectedFontSize = this.DEFAULT_FONT_SIZE;
      this.cdr.detectChanges();
    }
  }

  insertVariableFromMenu(variable: string) {
    if (variable) {
      const variableText = `{{${variable}}}`;
      this.editor.chain().focus().insertContent(variableText).run();
    }
  }

  isActive(format: string): boolean {
    if (!this.editor || (this.editor as any).isDestroyed) {
      return false;
    }
    try {
      return this.editor.isActive(format);
    } catch {
      return false;
    }
  }

  isAlignActive(alignment: 'left' | 'center' | 'right' | 'justify'): boolean {
    if (!this.editor || (this.editor as any).isDestroyed) {
      return false;
    }
    try {
      return this.editor.isActive({ textAlign: alignment });
    } catch {
      return false;
    }
  }

  updateContent(content: string) {
    if (this.editor && !(this.editor as any).isDestroyed) {
      this.editor.commands.setContent(content);
    }
  }

  showLinkInputMenu(): void {
    if (!this.editor) return;

    const { from, to } = this.editor.state.selection;
    if (from === to) return;

    this.savedSelection = { from, to };
    const previousUrl = this.editor.getAttributes('link')['href'] || '';
    this.linkInputUrl = previousUrl;

    const position = this.calculateMenuPosition(from, to, 400);
    this.linkInputPosition = position;

    this.showLinkInput = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      const input = document.querySelector('.link-input-inline input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  hideLinkInput(): void {
    this.showLinkInput = false;
    this.linkInputUrl = '';
    this.savedSelection = null;
  }

  saveLinkFromInput(): void {
    if (!this.editor || !this.linkInputUrl.trim() || !this.savedSelection) return;

    let url = this.linkInputUrl.trim();
    if (url && !url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }

    this.editor
      .chain()
      .focus()
      .setTextSelection(this.savedSelection)
      .setLink({ href: url })
      .run();

    this.hideLinkInput();
  }

  cancelLinkInput(): void {
    this.hideLinkInput();
    if (this.editor) {
      this.editor.commands.focus();
    }
  }

  private showLinkBubbleMenu(linkElement: HTMLAnchorElement): void {
    const href = linkElement.getAttribute('href') || '';
    this.linkBubbleUrl = href;

    const { from, to } = this.editor.state.selection;
    this.savedLinkSelection = { from, to };

    const position = this.calculateMenuPosition(from, to, 450);
    this.linkBubblePosition = position;

    this.showLinkBubble = true;
    this.cdr.detectChanges();
  }

  private calculateMenuPosition(from: number, to: number, menuWidth: number): { top: string; left: string } {
    const { view } = this.editor;
    const start = view.coordsAtPos(from);
    const editorRect = this.editorContainer.nativeElement.getBoundingClientRect();

    let top = start.bottom - editorRect.top + 8;
    let left = start.left - editorRect.left;

    const editorWidth = editorRect.width;
    const editorHeight = editorRect.height;
    const menuHeight = 50;

    if (left + menuWidth > editorWidth) {
      left = editorWidth - menuWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    const bottomSpace = editorHeight - (start.bottom - editorRect.top);
    if (bottomSpace < menuHeight + 16) {
      top = start.top - editorRect.top - menuHeight - 8;
    }
    if (top < 8) {
      top = 8;
    }

    return {
      top: `${top}px`,
      left: `${left}px`
    };
  }

  hideLinkBubble(): void {
    this.showLinkBubble = false;
    this.linkBubbleUrl = '';
    this.savedLinkSelection = null;
  }

  editLink(): void {
    if (!this.editor) return;
    const url = this.linkBubbleUrl;

    this.editor.chain().focus().extendMarkRange('link').run();
    const extendedSelection = this.editor.state.selection;
    this.savedSelection = {
      from: extendedSelection.from,
      to: extendedSelection.to
    };

    this.hideLinkBubble();
    this.linkInputUrl = url;

    const position = this.calculateMenuPosition(
      this.savedSelection.from,
      this.savedSelection.to,
      400
    );
    this.linkInputPosition = position;

    this.showLinkInput = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      const input = document.querySelector('.link-input-inline input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  removeLink(): void {
    if (!this.editor) return;
    this.editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run();

    this.hideLinkBubble();
  }

  visitLink(): void {
    if (this.linkBubbleUrl) {
      window.open(this.linkBubbleUrl, '_blank', 'noopener,noreferrer');
    }
  }


  insertImage(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (event: any) => this.onImageSelected(event);
    fileInput.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.editor) return;

    const file = input.files[0];

    if (file.size > this.maxImageSize) {
      console.warn(`Image size exceeds ${this.maxImageSize / (1024 * 1024)}MB limit`);
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      console.warn('Please select a valid image file');
      input.value = '';
      return;
    }


    const tempId = `temp-image-${Date.now()}-${Math.random()}`;


    this.selectedImages.push({ file, tempId });


    const imageHtml = `<a href="#" class="editor-link image-link" data-temp-id="${tempId}" data-filename="${file.name}">${file.name}</a> `;

    this.editor.chain().focus().insertContent(imageHtml).run();


    this.imagesSelected.emit(this.selectedImages);

    input.value = '';
  }
}