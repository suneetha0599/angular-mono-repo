import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDocumentComponent } from './vendor-document.component';

describe('VendorDocumentComponent', () => {
  let component: VendorDocumentComponent;
  let fixture: ComponentFixture<VendorDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorDocumentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
