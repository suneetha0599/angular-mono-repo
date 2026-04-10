import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorListingComponent } from './vendor-listing.component';

describe('VendorListingComponent', () => {
  let component: VendorListingComponent;
  let fixture: ComponentFixture<VendorListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
