import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[fileDrop]'
})
export class FileDropDirective {


  @Output() fileDropped = new EventEmitter<FileList>();

  constructor() { }

  @HostListener('dragover', ['$event'])
  onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event'])
  onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    const files = evt.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}
