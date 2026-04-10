import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDocUploadComponent } from './vendor-doc-upload.component';

describe('VendorDocUploadComponent', () => {
  let component: VendorDocUploadComponent;
  let fixture: ComponentFixture<VendorDocUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorDocUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorDocUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
