import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataInventoryDialogComponent } from './data-inventory-dialog.component';

describe('DataInventoryDialogComponent', () => {
  let component: DataInventoryDialogComponent;
  let fixture: ComponentFixture<DataInventoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataInventoryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataInventoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
