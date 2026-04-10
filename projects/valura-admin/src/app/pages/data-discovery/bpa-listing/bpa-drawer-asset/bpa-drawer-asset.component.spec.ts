import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaDrawerAssetComponent } from './bpa-drawer-asset.component';

describe('BpaDrawerAssetComponent', () => {
  let component: BpaDrawerAssetComponent;
  let fixture: ComponentFixture<BpaDrawerAssetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaDrawerAssetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaDrawerAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
