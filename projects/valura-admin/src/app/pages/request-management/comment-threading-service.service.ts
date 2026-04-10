
import { Injectable } from '@angular/core';

export interface CommentRecord {
  attachments: any[];
  id: number;
  author: string;
  timestamp: string;
  avatar: string;
  mention?: string;
  content: string;
  isReply: boolean;
  parentId?: number;
  depth?: number;
  createdAt?: string;
  authorId?: number;
  isSelfReply?: boolean;
}

interface ThreadConnection {
  parentId: number;
  replyId: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  connectionType: 'curved' | 'right-angled';
  isSelfReply: boolean;
}

interface ScrollMetrics {
  scrollTop: number;
  scrollLeft: number;
  containerHeight: number;
  containerWidth: number;
  contentHeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommentThreadingService {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private scrollContainer!: HTMLElement;
  private activeConnections: ThreadConnection[] = [];
  private currentScrollMetrics: ScrollMetrics = {
    scrollTop: 0,
    scrollLeft: 0,
    containerHeight: 0,
    containerWidth: 0,
    contentHeight: 0
  };

  private readonly cornerRadius: number = 8;
  private readonly lineWidth: number = 1.5;
  private readonly lineColor: string = '#374151';
  private readonly selfReplyLineColor: string = '#374151';
  private readonly avatarRadius: number = 20;
  private readonly avatarHeight: number = 40;
  private readonly connectionGap: number = 5;
  private readonly selfReplyOffset: number = -3;

  private isInitialized: boolean = false;
  private redrawScheduled: boolean = false;
  private resizeObserver?: ResizeObserver;

  constructor() { }

  initializeCanvas(canvasElement: HTMLCanvasElement): boolean {
    if (!canvasElement) {
      console.error('Canvas element is not provided');
      return false;
    }

    if (this.isInitialized) {
      this.cleanup();
    }

    this.canvas = canvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D rendering context');
      return false;
    }

    this.ctx = ctx;
    this.scrollContainer = this.findScrollContainer();
    this.setupCanvas();
    this.setupEventListeners();
    this.initializeScrollMetrics();
    this.isInitialized = true;
    return true;
  }

  private cleanup(): void {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.handleScrollMetricsUpdate);
    }
    window.removeEventListener('resize', this.handleResize);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    this.clearCanvas();
    this.activeConnections = [];
    this.redrawScheduled = false;
  }

  private findScrollContainer(): HTMLElement {
    const commentsScrollContainer = document.querySelector('.w-full.h-full.overflow-y-auto') as HTMLElement;

    if (commentsScrollContainer) {
      return commentsScrollContainer;
    }
    let element = this.canvas.parentElement;
    while (element && element !== document.body) {
      const style = window.getComputedStyle(element);
      const isScrollable = ['auto', 'scroll'].includes(style.overflowY);
      const hasScroll = element.scrollHeight > element.clientHeight;

      if (isScrollable && hasScroll) {
        return element;
      }
      element = element.parentElement;
    }

    return this.canvas.parentElement || document.documentElement;
  }

  private initializeScrollMetrics(): void {
    this.updateScrollMetrics();
  }

  private updateScrollMetrics(): void {
    if (this.scrollContainer) {
      const rect = this.scrollContainer.getBoundingClientRect();
      this.currentScrollMetrics = {
        scrollTop: this.scrollContainer.scrollTop,
        scrollLeft: this.scrollContainer.scrollLeft,
        containerHeight: rect.height,
        containerWidth: rect.width,
        contentHeight: this.scrollContainer.scrollHeight
      };
    }
  }

  private setupEventListeners(): void {
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', this.handleScrollMetricsUpdate.bind(this), {
        passive: true
      });
    }

    window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
  }

  private handleScrollMetricsUpdate = (): void => {
    this.updateScrollMetrics();
  };

  private handleResize = (): void => {
    if (this.isInitialized) {
      this.updateCanvasSize();
      this.updateScrollMetrics();
      this.redrawCurrentThreads();
    }
  };

  private redrawCurrentThreads(): void {
    const event = new CustomEvent('requestRedraw');
    document.dispatchEvent(event);
  }

  private setupCanvas(): void {
    this.updateCanvasSize();

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateCanvasSize();
        this.updateScrollMetrics();
        this.redrawCurrentThreads();
      });

      if (this.scrollContainer) {
        this.resizeObserver.observe(this.scrollContainer);
      }
    }
  }

  private updateCanvasSize(): void {
    if (!this.scrollContainer) return;

    const scrollContainerRect = this.scrollContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const viewportWidth = scrollContainerRect.width;
    const contentHeight = this.scrollContainer.scrollHeight;

    this.canvas.width = viewportWidth * dpr;
    this.canvas.height = contentHeight * dpr;

    this.canvas.style.width = `${viewportWidth}px`;
    this.canvas.style.height = `${contentHeight}px`;

    this.ctx.scale(dpr, dpr);

    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0px';
    this.canvas.style.left = '0px';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
  }

  private getElementPosition(element: HTMLElement): {
    x: number;
    y: number;
    width: number;
    height: number;
    isVisible: boolean;
  } | null {
    if (!element || !this.canvas || !this.scrollContainer) {
      return null;
    }

    try {
      const elementRect = element.getBoundingClientRect();
      const scrollContainerRect = this.scrollContainer.getBoundingClientRect();

      const relativeX = elementRect.left - scrollContainerRect.left;
      const relativeY = elementRect.top - scrollContainerRect.top + this.scrollContainer.scrollTop;

      const isVisible = this.isElementVisibleInScrollContainer(elementRect, scrollContainerRect);

      return {
        x: relativeX,
        y: relativeY,
        width: elementRect.width,
        height: elementRect.height,
        isVisible
      };
    } catch (error) {
      console.error('Error calculating element position:', error);
      return null;
    }
  }

  public reinitializeAfterTabSwitch(): void {
    if (this.isInitialized && this.canvas) {
      setTimeout(() => {
        this.updateCanvasSize();
        this.updateScrollMetrics();
        this.setupEventListeners();
        this.redrawCurrentThreads();
      }, 150);
    }
  }

  private isElementVisibleInScrollContainer(elementRect: DOMRect, containerRect: DOMRect): boolean {
    const elementTop = elementRect.top;
    const elementBottom = elementRect.bottom;
    const containerTop = containerRect.top;
    const containerBottom = containerRect.bottom;

    return elementBottom > containerTop && elementTop < containerBottom;
  }

  private buildCommentHierarchy(comments: CommentRecord[]): Map<number, CommentRecord[]> {
    const hierarchy = new Map<number, CommentRecord[]>();

    comments.filter(c => !c.isReply).forEach(parent => {
      hierarchy.set(parent.id, []);
    });

    comments.filter(c => c.isReply && c.parentId).forEach(reply => {
      const parentId = reply.parentId!;
      if (!hierarchy.has(parentId)) {
        hierarchy.set(parentId, []);
      }

      const parentComment = comments.find(p => p.id === parentId);
      if (parentComment) {
        reply.isSelfReply = this.isSelfReply(parentComment, reply);
      }

      hierarchy.get(parentId)!.push(reply);
    });

    hierarchy.forEach(replies => {
      replies.sort((a, b) => a.id - b.id);
    });

    return hierarchy;
  }

  private isSelfReply(parentComment: CommentRecord, replyComment: CommentRecord): boolean {
    if (parentComment.authorId && replyComment.authorId) {
      return parentComment.authorId === replyComment.authorId;
    }
    if (parentComment.author && replyComment.author) {
      return parentComment.author.trim().toLowerCase() === replyComment.author.trim().toLowerCase();
    }
    if (parentComment.avatar && replyComment.avatar) {
      return parentComment.avatar === replyComment.avatar;
    }
    return false;
  }

  private calculateConnectionPoints(
    parentElement: HTMLElement,
    replyElement: HTMLElement,
    isSelfReply: boolean = false
  ): {
    start: { x: number; y: number };
    end: { x: number; y: number };
    isValid: boolean;
    connectionType: 'curved' | 'right-angled';
  } | null {
    const parentPos = this.getElementPosition(parentElement);
    const replyPos = this.getElementPosition(replyElement);

    if (!parentPos || !replyPos) {
      return null;
    }

    if (isSelfReply) {
      const startX = parentPos.x + this.avatarRadius + this.selfReplyOffset;
      const startY = parentPos.y + this.avatarHeight + this.connectionGap;
      const endX = replyPos.x + this.avatarRadius + this.selfReplyOffset;
      const endY = replyPos.y + this.avatarRadius;
      return {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        isValid: true,
        connectionType: 'curved'
      };
    } else {
      const startX = parentPos.x + this.avatarRadius;
      const startY = parentPos.y + this.avatarHeight + this.connectionGap;
      const endX = replyPos.x - this.connectionGap;
      const endY = replyPos.y + this.avatarRadius;

      return {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        isValid: true,
        connectionType: 'curved'
      };
    }
  }

  private drawRightAngledConnection(startX: number, startY: number, endX: number, endY: number): void {
    if (!this.ctx || !this.isValidCoordinate(startX, startY) || !this.isValidCoordinate(endX, endY)) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.strokeStyle = this.selfReplyLineColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.moveTo(startX, startY);
    const cornerY = endY;
    this.ctx.lineTo(startX, cornerY);

    this.ctx.lineTo(endX, cornerY);

    this.ctx.stroke();
  }

  private drawOptimizedConnection(startX: number, startY: number, endX: number, endY: number): void {
    if (!this.ctx || !this.isValidCoordinate(startX, startY) || !this.isValidCoordinate(endX, endY)) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.strokeStyle = this.lineColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);

    const minDistance = this.cornerRadius * 2;

    if (deltaX < minDistance && deltaY < minDistance) {
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
      return;
    }

    const actualRadius = Math.min(this.cornerRadius, deltaX / 3, deltaY / 3);

    const cornerX = startX;
    const cornerY = endY;

    const verticalEndY = cornerY - Math.sign(cornerY - startY) * actualRadius;
    const horizontalStartX = cornerX + actualRadius;
    this.ctx.moveTo(startX, startY);

    if (Math.abs(verticalEndY - startY) > actualRadius) {
      this.ctx.lineTo(startX, verticalEndY);

      const controlX = startX;
      const controlY = cornerY;
      this.ctx.quadraticCurveTo(controlX, controlY, horizontalStartX, cornerY);

      this.ctx.lineTo(endX, endY);
    } else {
      const midX = startX + (endX - startX) / 2;
      const midY = startY + (endY - startY) / 2;
      this.ctx.quadraticCurveTo(midX, midY, endX, endY);
    }

    this.ctx.stroke();
  }

  private isValidCoordinate(x: number, y: number): boolean {
    return typeof x === 'number' && typeof y === 'number' &&
      !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
  }
  drawAllThreadingLines(commentsData: CommentRecord[]): void {
    if (!this.isInitialized || !this.ctx || !this.canvas) {
      console.error('Threading service not properly initialized');
      return;
    }

    try {
      this.updateScrollMetrics();
      this.clearCanvas();
      this.activeConnections = [];
      const commentHierarchy = this.buildCommentHierarchy(commentsData);
      let connectionsDrawn = 0;

      commentHierarchy.forEach((replies, parentId) => {
        if (replies.length === 0) return;

        const parentElement = this.findCommentAvatar(parentId);
        if (!parentElement) {
          return;
        }

        replies.forEach(reply => {
          const replyElement = this.findCommentAvatar(reply.id);
          if (!replyElement) {
            return;
          }
          if (reply.isSelfReply) {
            this.applySelfReplyAvatarStyling(replyElement);
          }

          const connectionPoints = this.calculateConnectionPoints(
            parentElement,
            replyElement,
            reply.isSelfReply || false
          );

          if (connectionPoints && connectionPoints.isValid) {
            if (connectionPoints.connectionType === 'right-angled') {
              this.drawRightAngledConnection(
                connectionPoints.start.x,
                connectionPoints.start.y,
                connectionPoints.end.x,
                connectionPoints.end.y
              );
            } else {
              this.drawOptimizedConnection(
                connectionPoints.start.x,
                connectionPoints.start.y,
                connectionPoints.end.x,
                connectionPoints.end.y
              );
            }

            this.activeConnections.push({
              parentId,
              replyId: reply.id,
              startPoint: connectionPoints.start,
              endPoint: connectionPoints.end,
              connectionType: connectionPoints.connectionType,
              isSelfReply: reply.isSelfReply || false
            });

            connectionsDrawn++;
          }
        });
      });

      console.debug(`Threading: ${connectionsDrawn} connections drawn`);

    } catch (error) {
      console.error('Error drawing threading lines:', error);
    }
  }

  private applySelfReplyAvatarStyling(avatarElement: HTMLElement): void {
    avatarElement.style.transform = `translateX(${this.selfReplyOffset}px) rotate(2deg)`;
    avatarElement.style.zIndex = '10';
    avatarElement.style.position = 'relative';
    avatarElement.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
  }

  private findCommentAvatar(commentId: number): HTMLElement | null {
    return document.querySelector(`#comment-${commentId} .avatar`) as HTMLElement;
  }

  private clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;

    const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  areCommentElementsReady(commentsData: CommentRecord[]): boolean {
    const parentComments = commentsData.filter(comment => !comment.isReply);
    const replyComments = commentsData.filter(comment => comment.isReply);

    const parentElementsReady = parentComments.every(comment => {
      const element = this.findCommentAvatar(comment.id);
      return element !== null && this.isElementProperlyRendered(element);
    });

    const replyElementsReady = replyComments.every(comment => {
      const element = this.findCommentAvatar(comment.id);
      return element !== null && this.isElementProperlyRendered(element);
    });

    return parentElementsReady && replyElementsReady;
  }

  private isElementProperlyRendered(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  isReady(): boolean {
    return this.isInitialized && !!this.canvas && !!this.ctx;
  }

  getActiveConnections(): ThreadConnection[] {
    return [...this.activeConnections];
  }

  getCurrentScrollMetrics(): ScrollMetrics {
    return { ...this.currentScrollMetrics };
  }

  forceRedraw(commentsData: CommentRecord[]): void {
    if (this.isReady()) {
      this.drawAllThreadingLines(commentsData);
    }
  }

  destroy(): void {
    this.resetAllAvatarStyling();

    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.handleScrollMetricsUpdate);
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    this.clearCanvas();
    this.activeConnections = [];
    this.currentScrollMetrics = {
      scrollTop: 0,
      scrollLeft: 0,
      containerHeight: 0,
      containerWidth: 0,
      contentHeight: 0
    };
    this.isInitialized = false;
  }

  private resetAllAvatarStyling(): void {
    const avatars = document.querySelectorAll('.avatar');
    avatars.forEach(avatar => {
      const element = avatar as HTMLElement;
      element.style.transform = '';
      element.style.zIndex = '';
      element.style.position = '';
      element.style.border = '';
      element.style.boxShadow = '';
    });
  }
}
