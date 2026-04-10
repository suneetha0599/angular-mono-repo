import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaListingComponent } from './bpa-listing.component';

describe('BpaListingComponent', () => {
  let component: BpaListingComponent;
  let fixture: ComponentFixture<BpaListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
