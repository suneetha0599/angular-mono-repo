import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaDrawerDataElementsComponent } from './bpa-drawer-data-elements.component';

describe('BpaDrawerDataElementsComponent', () => {
  let component: BpaDrawerDataElementsComponent;
  let fixture: ComponentFixture<BpaDrawerDataElementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaDrawerDataElementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaDrawerDataElementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
