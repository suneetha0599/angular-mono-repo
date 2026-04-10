import { Directive, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { debounceTime, distinctUntilChanged, skip, Subscription } from 'rxjs';

@Directive({
  selector: '[ngModelDebounceChange]'
})
export class NgModelDebounceChangeDirective implements OnDestroy, OnInit {

  /** Emit event when model has changed. */
  @Output() ngModelDebounceChange = new EventEmitter<any>();
  @Input() debounceTime = 500 //ms

  /** Subscriptions for cleanup. */
  private subscription!: Subscription;

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.ngModel.control.valueChanges
      .pipe(skip(1), debounceTime(this.debounceTime), distinctUntilChanged())
      .subscribe(value => this.ngModelDebounceChange.emit(value));
  }

  constructor(private ngModel: NgModel) { }

}
