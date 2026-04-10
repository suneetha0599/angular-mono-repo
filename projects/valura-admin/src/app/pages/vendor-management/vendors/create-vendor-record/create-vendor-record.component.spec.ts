import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateVendorRecordComponent } from './create-vendor-record.component';

describe('CreateVendorRecordComponent', () => {
  let component: CreateVendorRecordComponent;
  let fixture: ComponentFixture<CreateVendorRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateVendorRecordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateVendorRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
