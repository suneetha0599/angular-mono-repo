import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFufillmentDialogComponent } from './data-fufillment-dialog.component';

describe('DataFufillmentDialogComponent', () => {
  let component: DataFufillmentDialogComponent;
  let fixture: ComponentFixture<DataFufillmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataFufillmentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataFufillmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
