import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdpConfigurationListingComponent } from './idp-configuration-listing.component';

describe('IdpConfigurationListingComponent', () => {
  let component: IdpConfigurationListingComponent;
  let fixture: ComponentFixture<IdpConfigurationListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdpConfigurationListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdpConfigurationListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
