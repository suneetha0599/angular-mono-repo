import { Injectable, ComponentRef, Injector, ApplicationRef, ComponentFactoryResolver, Type } from '@angular/core';
import { DomPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';

export interface PopupRef<T = any> {
  afterClosed: Subject<T | undefined>;
  close: (value?: T) => void;
}

@Injectable({ providedIn: 'root' })
export class WindowService {
  private popups = new Map<string, PopupRef<any>[]>();

  constructor(
    private appRef: ApplicationRef,
    private injector: Injector,
    private cfr: ComponentFactoryResolver
  ) { }

  open<T = any>(component: Type<any>, key: string, allowMultiple = true): PopupRef<T> {
    const container = document.createElement('div');
    container.classList.add('floating-panel');
    document.body.appendChild(container);

    const host = new DomPortalOutlet(container, this.cfr, this.appRef, this.injector);
    const portal = new ComponentPortal(component);
    const componentRef = host.attach(portal);

    const afterClosed = new Subject<T | undefined>();
    const popupRef: PopupRef<T> = {
      afterClosed,
      close: (value?: T) => {
        afterClosed.next(value);
        afterClosed.complete();
        host.detach();
        host.dispose();
        document.body.removeChild(container);

        const arr = this.popups.get(key) || [];
        const index = arr.indexOf(popupRef);
        if (index > -1) arr.splice(index, 1);
      }
    };

    (componentRef.instance as any).close = popupRef.close;

    if (!this.popups.has(key)) this.popups.set(key, []);
    this.popups.get(key)!.push(popupRef);

    return popupRef;
  }
}
