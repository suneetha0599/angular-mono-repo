import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTypeDialogComponent } from './view-type-dialog.component';

describe('ViewTypeDialogComponent', () => {
  let component: ViewTypeDialogComponent;
  let fixture: ComponentFixture<ViewTypeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewTypeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewTypeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
