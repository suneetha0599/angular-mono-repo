import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDrawerComponent } from './vendor-drawer.component';

describe('VendorDrawerComponent', () => {
  let component: VendorDrawerComponent;
  let fixture: ComponentFixture<VendorDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
