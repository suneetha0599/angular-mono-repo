import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLoadingItemsComponent } from './error-loading-items.component';

describe('ErrorLoadingItemsComponent', () => {
  let component: ErrorLoadingItemsComponent;
  let fixture: ComponentFixture<ErrorLoadingItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorLoadingItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorLoadingItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
