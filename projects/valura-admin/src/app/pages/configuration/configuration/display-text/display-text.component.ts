import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { DisplayText } from '@admin-core/models/configuration/display-text.model';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { DisplayTextPreviewDialogComponent } from './display-text-preview-dialog/display-text-preview-dialog.component';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { CanComponentDeactivate } from '@admin-core/guards/unsaved-change.guard';
import { AuthService } from '@admin-core/services/auth.service';
import { ConfirmationDialogService } from '@valura-lib/service/confirmation-dialog/confirmation-dialog.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-display-text',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    DragDropModule,
    LoadingButtonComponent,
    MatMenuModule,
    MatSelectModule
  ],
  templateUrl: './display-text.component.html',
  styleUrl: './display-text.component.scss'
})
export class DisplayTextComponent implements OnInit, OnDestroy, AfterViewInit, CanComponentDeactivate {
  pages: DisplayText[] = [];
  selectedPageId: number | null = null;
  pageForm!: FormGroup;
  hasFormChanged = false;
  isSaving = false;
  isLoading = true;
  isCreatingNewPage = false;
  editor!: Editor;
  @Output() formUpdated = new EventEmitter<boolean>();
  @ViewChild('editorContainer') editorContainer!: ElementRef;


  fontFamilies = [
    { label: 'Andale Mono', value: 'Andale Mono' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Arial Black', value: 'Arial Black, sans-serif' },
    { label: 'Book Antiqua', value: 'Book Antiqua, serif' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Impact', value: 'Impact, sans-serif' },
    { label: 'Symbol', value: 'Symbol' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
    { label: 'Terminal', value: 'Terminal' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
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

  private initialFormValue: any = null;
  private formSubscription: any = null;
  private cdr = inject(ChangeDetectorRef);
  private configApiHelperService = inject(ConfigApiHelperService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  private readonly DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
  private readonly DEFAULT_FONT_SIZE = '14px';

  constructor(private fb: FormBuilder) {
    this.initForm();
    this.trackFormChanges();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent): void {
    if (this.hasFormChanged && this.authService.isLoggedIn()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  canDeactivate(): boolean {
    if (this.hasFormChanged) {
      return false;
    }
    return true;
  }

  private async showUnsavedChangesDialog(): Promise<boolean> {
    return firstValueFrom(
      this.confirmationDialogService.showDialog(
        'Alert',
        'You have unsaved changes that will be lost. Are you sure you want to leave this page?',
        'Yes',
        'No',
        '420px',
      )
    );
  }

  async ngOnInit(): Promise<void> {
    await this.loadPages();
  }

  ngAfterViewInit(): void {
  }

  private async loadPages(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.configApiHelperService.getDisplayTextPages();

      if (response && response.dsrConfigurationPage) {
        this.pages = response.dsrConfigurationPage.sort((a: DisplayText, b: DisplayText) => (a.order ?? 0) - (b.order ?? 0));
        if (this.pages.length > 0 && !this.isCreatingNewPage) {
          setTimeout(() => {
            this.selectPage(this.pages[0].id);
          }, 100);
        }
      } else {
        this.pages = [];
      }
    } catch (error) {
      console.error('Error loading display text pages:', error);
      this.pages = [];
    } finally {
      this.isLoading = false;
    }
  }

  private initForm(): void {
    this.pageForm = this.fb.group({
      pageTitle: ['', Validators.required],
      pageContent: ['', Validators.required]
    });
  }

  private initEditor(content?: string): void {
    if (!this.editorContainer?.nativeElement) {
      console.warn('Editor container not available');
      return;
    }

    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
      this.editor = undefined as any;
    }

    let editorContent = content || this.pageForm.get('pageContent')?.value || '<p></p>';


    editorContent = editorContent.replace(/<p([^>]*)><\/p>/g, '<p$1><br></p>');
    editorContent = editorContent.replace(/<p([^>]*)>\s*<\/p>/g, '<p$1><br></p>');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (!textContent.trim()) {
      editorContent = '<p><br></p>';
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
        }),
        Extension.create({
          name: 'paragraphSpacing',
          addGlobalAttributes() {
            return [
              {
                types: ['paragraph'],
                attributes: {
                  marginLeft: {
                    default: 0,
                    parseHTML: element => {
                      const margin = element.style.marginLeft;
                      return margin ? parseInt(margin.replace('px', '')) : 0;
                    },
                    renderHTML: attributes => {
                      const styles: string[] = [];

                      const marginTop = attributes['marginTop'] || '0';
                      const marginRight = '0';
                      const marginBottom = attributes['marginBottom'] || '10px';
                      const marginLeft = attributes['marginLeft'] && attributes['marginLeft'] !== 0
                        ? `${attributes['marginLeft']}px`
                        : '0';

                      styles.push(`margin: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft}`);

                      if (styles.length > 0) {
                        return { style: styles.join('; ') };
                      }

                      return {};
                    },
                  },
                  marginTop: {
                    default: null,
                    parseHTML: element => {
                      const margin = element.style.marginTop;
                      return margin || null;
                    },
                    renderHTML: () => ({}),
                  },
                  marginBottom: {
                    default: null,
                    parseHTML: element => {
                      const margin = element.style.marginBottom;
                      return margin || null;
                    },
                    renderHTML: () => ({}),
                  },
                },
              },
              {
                types: ['listItem'],
                attributes: {
                  marginLeft: {
                    default: 0,
                    parseHTML: element => {
                      const margin = element.style.marginLeft;
                      return margin ? parseInt(margin.replace('px', '')) : 0;
                    },
                    renderHTML: attributes => {
                      const styles: string[] = [];

                      if (attributes['marginLeft'] && attributes['marginLeft'] !== 0) {
                        styles.push(`margin-left: ${attributes['marginLeft']}px`);
                      }

                      if (attributes['marginTop']) {
                        styles.push(`margin-top: ${attributes['marginTop']}`);
                      }

                      if (attributes['marginBottom']) {
                        styles.push(`margin-bottom: ${attributes['marginBottom']}`);
                      }

                      if (styles.length > 0) {
                        return { style: styles.join('; ') };
                      }

                      return {};
                    },
                  },
                  marginTop: {
                    default: null,
                    parseHTML: element => {
                      const margin = element.style.marginTop;
                      return margin || null;
                    },
                    renderHTML: () => ({}),
                  },
                  marginBottom: {
                    default: null,
                    parseHTML: element => {
                      const margin = element.style.marginBottom;
                      return margin || null;
                    },
                    renderHTML: () => ({}),
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
        TextStyle,
        FontFamily.configure({
          types: ['textStyle'],
        }),
        FontSize,
        Placeholder.configure({
          placeholder: 'Start writing here...',
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
        handleClick: () => {
          setTimeout(() => {
            this.updateFontSelections();
          }, 10);
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        let content = editor.getHTML();
        const text = editor.getText().trim();

        if (!text && content === '<p></p>') {
          editor.commands.setContent('<p><br></p>');
          return;
        }


        content = content.replace(/<p([^>]*)><\/p>/g, '<p$1><br></p>');
        content = content.replace(/<p([^>]*)>\s*<\/p>/g, '<p$1><br></p>');

        this.pageForm.patchValue({ pageContent: content }, { emitEvent: true });
      },
      onSelectionUpdate: () => {
        setTimeout(() => {
          this.updateFontSelections();
        }, 10);
      },
      onTransaction: () => {
        setTimeout(() => {
          this.updateFontSelections();
        }, 10);
      },
    });

    setTimeout(() => {
      if (this.editor && !(this.editor as any).isDestroyed) {

        this.editor.commands.focus();


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
    }, 100);
  }

  private trackFormChanges(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    this.formSubscription = this.pageForm.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });
  }

  private checkFormChanges(): void {
    if (!this.initialFormValue) {
      this.hasFormChanged = true;
      this.formUpdated.emit(true);
      return;
    }

    this.hasFormChanged = JSON.stringify(this.pageForm.value) !== JSON.stringify(this.initialFormValue);
    this.formUpdated.emit(this.hasFormChanged);
  }

  get selectedPage(): DisplayText | undefined {
    return this.pages.find(p => p.id === this.selectedPageId);
  }

  async selectPage(pageId: number): Promise<void> {
    const page = this.pages.find(p => p.id === pageId);
    if (!page) return;

    if (this.selectedPageId === pageId && !this.isCreatingNewPage) {
      return;
    }
    if (this.hasFormChanged) {
      try {
        const result = await this.showUnsavedChangesDialog();
        if (!result) {
          return;
        }
      } catch (error) {
        console.error('Error showing confirmation dialog:', error);
        return;
      }
    }

    this.isCreatingNewPage = false;
    this.selectedPageId = pageId;

    let pageContent = page.content || '<p></p>';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pageContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (!textContent.trim()) {
      pageContent = '<p></p>';
    }

    this.pageForm.patchValue({
      pageTitle: page.title,
      pageContent: pageContent
    }, { emitEvent: false });

    setTimeout(() => {
      this.initEditor(pageContent);

      setTimeout(() => {
        if (this.editorContainer?.nativeElement) {
          this.editorContainer.nativeElement.scrollTop = 0;
        }
        if (this.editor && !(this.editor as any).isDestroyed) {
          this.editor.commands.focus('start');
        }
      }, 100);
    }, 0);

    this.initialFormValue = { ...this.pageForm.value };
    this.hasFormChanged = false;

    setTimeout(() => {
      this.updateFontSelections();

      if (!this.selectedFontFamily) {
        this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
      }
      if (!this.selectedFontSize) {
        this.selectedFontSize = this.DEFAULT_FONT_SIZE;
      }
      this.cdr.detectChanges();
    }, 200);
  }

  async addNewPage(): Promise<void> {
    if (this.hasFormChanged) {
      try {
        const result = await this.showUnsavedChangesDialog();
        if (!result) {
          return;
        }
      } catch (error) {
        console.error('Error showing confirmation dialog:', error);
        return;
      }
    }

    this.isCreatingNewPage = true;
    this.selectedPageId = null;

    const defaultContent = '<p></p>';

    this.pageForm.patchValue({
      pageTitle: '',
      pageContent: defaultContent
    }, { emitEvent: false });

    setTimeout(() => {
      this.initEditor(defaultContent);
    }, 0);

    this.initialFormValue = null;
    this.hasFormChanged = true;
    this.formUpdated.emit(true);
  }

  private getNextOrderValue(): number {
    if (this.pages.length === 0) {
      return 0;
    }
    const maxOrder = Math.max(...this.pages.map(p => p.order ?? 0));
    return maxOrder + 1;
  }

  undo(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;

    this.editor.chain().focus().undo().run();

    setTimeout(() => {
      if (this.editor && !(this.editor as any).isDestroyed) {
        const content = this.editor.getHTML();
        const div = document.createElement('div');
        div.innerHTML = content;
        const text = div.textContent || div.innerText || '';

        if (!text.trim()) {
          this.editor.commands.setContent('<p></p>');
        }

        this.editor.commands.setTextSelection(0);
        this.editor.commands.focus('start');

        const container = this.editorContainer?.nativeElement;
        const tiptapEditor = container?.querySelector('.tiptap-editor');
        const proseMirror = container?.querySelector('.ProseMirror');

        if (container) {
          container.scrollTop = 0;
        }
        if (tiptapEditor) {
          (tiptapEditor as HTMLElement).scrollTop = 0;
        }
        if (proseMirror) {
          (proseMirror as HTMLElement).scrollTop = 0;
        }

        setTimeout(() => {

          if (container) {
            container.scrollTop = 0;
          }
        }, 10);
      }
      this.cdr.detectChanges();
    }, 50);
  }

  redo(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;

    this.editor.chain().focus().redo().run();

    setTimeout(() => {
      if (this.editor && !(this.editor as any).isDestroyed) {
        this.editor.commands.focus('end');

        const editorElement = this.editorContainer?.nativeElement;
        if (editorElement) {
          const proseMirror = editorElement.querySelector('.ProseMirror');
          if (proseMirror) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              const containerRect = editorElement.getBoundingClientRect();

              if (rect.bottom > containerRect.bottom) {
                editorElement.scrollTop = editorElement.scrollHeight;
              }
            }
          }
        }
      }
      this.cdr.detectChanges();
    }, 0);
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

  getActiveFontFamily(): string {
    if (!this.editor || (this.editor as any).isDestroyed) {
      return '';
    }
    try {
      const attributes = this.editor.getAttributes('textStyle');
      const fontFamily = attributes['fontFamily'];
      return fontFamily || '';
    } catch {
      return '';
    }
  }

  getActiveFontSize(): string {
    if (!this.editor || (this.editor as any).isDestroyed) {
      return '';
    }
    try {
      const attributes = this.editor.getAttributes('textStyle');
      const fontSize = attributes['fontSize'];
      return fontSize || '';
    } catch {
      return '';
    }
  }

  getFontFamilyLabel(value: string): string {
    if (!value) return 'Font';
    const font = this.fontFamilies.find(f => f.value === value);
    return font ? font.label : 'Font';
  }

  getFontSizeLabel(value: string): string {
    if (!value) return 'Size';
    const size = this.fontSizes.find(s => s.value === value);
    return size ? size.label : 'Size';
  }

  onPreview(): void {
    if (this.editor) {
      const currentContent = this.editor.getHTML();
      this.pageForm.patchValue({ pageContent: currentContent }, { emitEvent: false });
    }

    if (!this.pageForm.valid) {
      this.pageForm.markAllAsTouched();
      return;
    }

    const title = this.pageForm.get('pageTitle')?.value;
    const content = this.pageForm.get('pageContent')?.value;

    this.dialog.open(DisplayTextPreviewDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      panelClass: 'dialog-wrapper',
      data: {
        title: title,
        htmlContent: content
      }
    });
  }

  onCancel(): void {
    if (this.isCreatingNewPage) {
      if (this.pages.length > 0) {
        this.hasFormChanged = false;
        this.isCreatingNewPage = false;
        this.selectPage(this.pages[0].id);
      } else {
        this.pageForm.reset();
        this.initialFormValue = null;
        this.hasFormChanged = false;
        this.isCreatingNewPage = false;
        this.selectedPageId = null;
      }
    } else {
      if (this.initialFormValue) {
        this.pageForm.patchValue(this.initialFormValue, { emitEvent: false });

        if (this.initialFormValue.pageContent) {
          setTimeout(() => {
            this.initEditor(this.initialFormValue.pageContent);
          }, 0);
        }

        this.hasFormChanged = false;
        this.formUpdated.emit(false);
      }
    }
  }

  async onSave(): Promise<void> {
    if (this.editor) {
      let currentContent = this.editor.getHTML();
      currentContent = currentContent.replace(/<p([^>]*)><\/p>/g, '<p$1><br></p>');
      currentContent = currentContent.replace(/<p([^>]*)>\s*<\/p>/g, '<p$1><br></p>');
      this.pageForm.patchValue({ pageContent: currentContent }, { emitEvent: false });
    }

    this.pageForm.markAllAsTouched();

    if (!this.pageForm.valid) {
      return;
    }

    if (this.isContentEmpty()) {
      this.pageForm.get('pageContent')?.setErrors({ 'required': true });
      this.pageForm.get('pageContent')?.markAsTouched();
      return;
    }

    const title = this.pageForm.get('pageTitle')?.value;
    const content = this.pageForm.get('pageContent')?.value;

    try {
      this.isSaving = true;

      if (this.isCreatingNewPage) {
        const orderValue = this.getNextOrderValue();

        const createData = {
          title: title,
          description: content,
          order: orderValue
        };

        const response = await this.configApiHelperService.createDisplayTextPage(createData);

        this.snackbarService.openSnack('Page created successfully!', 'OK', 3000);
        this.isCreatingNewPage = false;
        this.hasFormChanged = false;

        await this.loadPages();

        if (response?.dsrConfigurationPage?.id) {
          setTimeout(() => {
            this.selectPage(response.dsrConfigurationPage.id);
          }, 200);
        }
      } else {
        const page = this.pages.find(p => p.id === this.selectedPageId);
        if (page) {

          const updateData = {
            title: title,
            description: content,
            order: page.order ?? 0
          };

          await this.configApiHelperService.UpdateDisplayTextPage(page.id, updateData);

          this.snackbarService.openSnack('Page updated successfully!', 'OK', 3000);

          page.title = title;
          page.content = content;

          this.initialFormValue = this.pageForm.value;
          this.hasFormChanged = false;

        }
      }
    } catch (error) {
      console.error('Error saving page:', error);
      this.snackbarService.openSnack('Failed to save page. Please try again.', 'OK', 3000);
    } finally {
      this.isSaving = false;
    }
  }

  private getPlainTextFromHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private isContentEmpty(): boolean {
    const htmlContent = this.pageForm.get('pageContent')?.value || '';
    const plainText = this.getPlainTextFromHtml(htmlContent).trim();
    return plainText.length === 0;
  }

  async onPageDrop(event: CdkDragDrop<DisplayText[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.pages, event.previousIndex, event.currentIndex);

    const dsrConfigurationPageOrderList = this.pages.map((page, index) => {
      page.order = index;
      return {
        id: page.id,
        order: index
      };
    });

    try {
      await this.configApiHelperService.updateDisplayTextPageOrder({
        dsrConfigurationPageOrderList
      });
    } catch (error) {
      console.error('Error updating page order:', error);
      await this.loadPages();
    }
  }

  deletePage(page: DisplayText): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        type: 'confirmation',
        title: 'Delete Page',
        content: 'Are you sure you want to delete this page?',
        confirmationDetail: page.title,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning',
        iconColor: 'text-red-600'
      },
      panelClass: 'dialog-wrapper'
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.performDeletePage(page.id);
      }
    });
  }

  async performDeletePage(pageId: number): Promise<void> {
    try {
      await this.configApiHelperService.deleteDisplayTextPage(pageId);

      this.pages = this.pages.filter(p => p.id !== pageId);

      if (this.selectedPageId === pageId) {
        if (this.pages.length > 0) {
          setTimeout(() => {
            this.selectPage(this.pages[0].id);
          }, 0);
        } else {
          this.selectedPageId = null;
          this.pageForm.reset();
        }
      }

      this.snackbarService.openSnack('Page deleted successfully!', 'OK', 3000);
    } catch (error) {
      console.error('Error deleting page:', error);
      this.snackbarService.openSnack('Failed to delete page. Please try again.', 'OK', 3000);
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
      this.editor = undefined as any;
    }
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  private updateFontSelections(): void {
    if (!this.editor || (this.editor as any).isDestroyed) return;

    try {
      const attributes = this.editor.getAttributes('textStyle');


      let fontFamily = attributes['fontFamily'] || '';
      let fontSize = attributes['fontSize'] || '';


      if (fontFamily) {

        const exactMatch = this.fontFamilies.find(f => f.value === fontFamily);
        if (exactMatch) {
          this.selectedFontFamily = exactMatch.value;
        } else {

          const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
          const partialMatch = this.fontFamilies.find(f => {
            const firstFontInList = f.value.split(',')[0].trim().replace(/['"]/g, '');
            return firstFontInList.toLowerCase() === firstFont.toLowerCase();
          });

          if (partialMatch) {
            this.selectedFontFamily = partialMatch.value;
          } else {
            this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
          }
        }
      } else {
        this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
      }


      if (fontSize) {
        const matchingSize = this.fontSizes.find(s => s.value === fontSize);
        this.selectedFontSize = matchingSize ? matchingSize.value : this.DEFAULT_FONT_SIZE;
      } else {
        this.selectedFontSize = this.DEFAULT_FONT_SIZE;
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.warn('Error updating font selections:', error);
      this.selectedFontFamily = this.DEFAULT_FONT_FAMILY;
      this.selectedFontSize = this.DEFAULT_FONT_SIZE;
      this.cdr.detectChanges();
    }
  }
}
