import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskSummaryPageComponent } from './risk-summary-page.component';

describe('RiskSummaryScreenComponent', () => {
  let component: RiskSummaryPageComponent;
  let fixture: ComponentFixture<RiskSummaryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskSummaryPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskSummaryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
