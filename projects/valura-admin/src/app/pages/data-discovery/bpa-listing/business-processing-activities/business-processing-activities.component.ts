import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { Edge, Node, Layout } from '@swimlane/ngx-graph';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import * as shape from 'd3-shape';
import { DagreNodesOnlyLayout } from '@admin-core/utils/CustomDagreNodesOnly';
import { ContentMeasureDirective } from '../../../../../../../valura-lib/src/lib/directives/content-measure.directive';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { buildDataForDFD } from '../bpa-utils';
import { FormGroup } from '@angular/forms';
import { BpaService } from '@admin-core/services/bpa/bpa.service';
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: 'business-processing-activities',
  imports: [CommonModule, NgxGraphModule, MatIconModule, ContentMeasureDirective, MatSlideToggleModule, MatButtonModule, MatMenuModule],
  templateUrl: './business-processing-activities.component.html',
  styleUrl: './business-processing-activities.component.scss'
})
export class BusinessProcessingActivitiesComponent {
  private bpaService = inject(BpaService)
  @Input() createBpaForm!: FormGroup;

  @Output() onSaveDraftBpa = new EventEmitter<any>();

  layoutSettings = {
    orientation: 'LR',
    rankSep: 200,
    nodeSep: 150
  };
  curve = shape.curveBundle.beta(1)
  layout: Layout = new DagreNodesOnlyLayout();
  zoomLevel = 0.8;
  zoomSpeed = 0.1;
  minZoom = 0.1;
  maxZoom = 1.5;
  panOnZoom = false;
  autoZoom = true;
  autoCenter = true;
  MIN_WIDTH = 240;
  MIN_HEIGHT = 60;
  menuPosition = { x: 0, y: 0 };
  selectedNode: any = null;
  selectedNodeId: string | null = null;
  hoveredNodeId: string | null = null;
  popupPosition = { top: 0, left: 0 };
  private isDragging = false;
  sampleData = [{ name: "Data Subject" }, { name: "Source" }, { name: "Asset" }, { name: "Recepient" }]
  legends = [{
    name: "External",
    color: "#BA1A1A"
  }, {
    name: "Internal",
    color: "#28A745"
  }]
  nodes: Node[] = [];
  links: Edge[] = [];
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  @ViewChild('menuTriggerButton', { read: ElementRef }) menuTriggerButton!: ElementRef<HTMLElement>;


  constructor(private router: Router) { }

  ngOnInit(): void {
    this.buildNodeAndLink()
  }

  buildNodeAndLink() {
    const bpaData = this.createBpaForm.value;
    const { nodes, links } = buildDataForDFD(bpaData);
    this.nodes = [...nodes];
    this.links = [...links]
  }

  public getStyles(node: Node): any {
    return {
      'background-color': node.data?.backgroundColor,
      'border': `2px solid ${node.data?.borderColor}`,
      'borderRadius': `${node.data?.borderRadius}px`,
      'height': `${node.data?.height}px`,
      'width': `${node.data?.width}px`,
      'minWidth': `${node.data?.minWidth}px`,
    };
  }

  onNodeSize(size: { width: number; height: number }, node: any) {
    node.data.width = size.width > this.MIN_WIDTH ? size.width : this.MIN_WIDTH;
    node.data.height = size.height;
  }

  onCancel() {

  }

  onSave() {
    this.router.navigate(['/user/data-discovery/bpa-dfd-details']);
  }


  zoomIn(): void {
    this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomSpeed);
    this.autoZoom = false;
    this.autoCenter = false;
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomSpeed);
    this.autoZoom = false;
    this.autoCenter = false;
  }

  onZoom(event: any): void {
    if (typeof event === 'number') {
      this.zoomLevel = event;
    } else if (event && typeof event.zoomLevel === 'number') {
      this.zoomLevel = event.zoomLevel;
    }
    this.autoZoom = false;
    this.autoCenter = false;
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomDelta = this.zoomSpeed;
    if (event.deltaY < 0) {
      this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + zoomDelta);
    } else {
      this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - zoomDelta);
    }

    this.autoZoom = false;
    this.autoCenter = false;
  }


  @HostListener('document:click')
  onOutsideClick(): void {
    this.closePopup();
  }

  closePopup(): void {
    this.selectedNode = null;
    this.selectedNodeId = null;
  }

  startDrag(): void {
    this.isDragging = false;
  }

  markDragging(): void {
    this.isDragging = true;
  }

  handleNodeClick(event: MouseEvent, node: any): void {
    event.stopPropagation();
    if (this.isDragging) return;

    this.selectNode(node, event);

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const button = this.menuTriggerButton.nativeElement;

    button.style.position = 'fixed';
    button.style.left = `${rect.left}px`;
    button.style.top = `${rect.bottom}px`;
    button.style.pointerEvents = 'auto';

    setTimeout(() => {
      this.menuTrigger.openMenu();
      button.style.pointerEvents = 'none';
    });
  }



  private async selectNode(node: any, event: MouseEvent): Promise<void> {
    this.selectedNode = node;
    this.selectedNodeId = node.id;
    this.selectedNode.locationNames = [];
    // if (node.hostingLocation?.length) {
    //   const countries = await Promise.all(
    //     node.hostingLocation.map((id: number) =>
    //       this.bpaService.getCountryById(id)
    //     )
    //   );
    //   this.selectedNode.locationNames = countries
    //     .filter(c => !!c?.name)
    //     .map(c => c.name);
    // }

    const svgElement = (event.target as HTMLElement).closest('foreignObject');
    const rect = svgElement?.getBoundingClientRect();

    if (rect) {
      this.popupPosition = {
        top: rect.bottom + 8,
        left: rect.left
      };
    }
  }

  getPopupStyles() {
    return {
      top: `${this.popupPosition.top}px`,
      left: `${this.popupPosition.left}px`,
      position: 'fixed',
    };
  }

  saveAsDraft() {
    this.onSaveDraftBpa.emit(true)
  }
}