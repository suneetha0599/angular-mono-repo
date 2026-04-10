import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Inject, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ImageViewerConfig {
  allowFullscreen?: boolean;
  btnShow?: {
    rotateClockwise: boolean;
    rotateCounterClockwise: boolean;
    zoomIn: boolean;
    zoomOut: boolean;
  };
  wheelZoom?: boolean;
  zoomFactor: number;
}

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent implements OnInit {

  @ViewChild(CdkDrag, { static: true }) cdkDrag!: CdkDrag;

  @Input() src!: string;
  @Input() config!: ImageViewerConfig;

  public loading = true;
  public showError = false;

  private scale = 1;
  private rotation = 0;

  public style = { transform: '' };

  // constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any) {
  //   if (dialogData?.src) {
  //     this.src = dialogData.src;
  //     this.config = dialogData.config ?? {};
  //   }
  // }

  ngOnInit() {
    this.config = {
      allowFullscreen: true,
      btnShow: { rotateClockwise: true, rotateCounterClockwise: true, zoomIn: true, zoomOut: true },
      wheelZoom: true,
      ...this.config
    };
  }

  zoomIn() {
    this.scale *= (1 + this.config.zoomFactor);
    this.updateStyle();
  }

  zoomOut() {
    if (this.scale > 0.2) this.scale /= (1 + this.config.zoomFactor);
    this.updateStyle();
  }

  rotateClockwise() {
    this.rotation += 90;
    this.updateStyle();
  }

  rotateCounterClockwise() {
    this.rotation -= 90;
    this.updateStyle();
  }

  scrollZoom(evt: WheelEvent) {
    if (this.config.wheelZoom) evt.deltaY > 0 ? this.zoomOut() : this.zoomIn();
  }


  onLoad() { this.loading = false; this.showError = false; }

  onLoadStart() { this.loading = true; }

  onError() { this.loading = false; this.showError = true; }

  reset() {
    this.scale = 1;
    this.rotation = 0;
    this.updateStyle();
    this.cdkDrag?.reset();
  }

  private updateStyle() {
    this.style.transform = `rotate(${this.rotation}deg) scale(${this.scale})`;
  }


  onDragStart(evt: any) {
    if (evt.source._dragRef._initialTransform && evt.source._dragRef._initialTransform.length > 0) {
      const myTranslate = evt.source._dragRef._initialTransform.split(' rotate')[0];
      const myRotate = this.style.transform.split(' rotate')[1];
      evt.source._dragRef._initialTransform = `${myTranslate} rotate${myRotate}`;
    } else {
      evt.source._dragRef._initialTransform = this.style.transform;
    }
  }
}
