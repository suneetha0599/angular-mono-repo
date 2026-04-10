import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataInventoryComponent } from './data-inventory.component';

describe('DataInventoryComponent', () => {
  let component: DataInventoryComponent;
  let fixture: ComponentFixture<DataInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataInventoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
