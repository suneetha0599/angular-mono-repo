import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskMitigationTabScreenComponent } from './risk-mitigation-tab-screen.component';

describe('RiskMitigationTabScreenComponent', () => {
  let component: RiskMitigationTabScreenComponent;
  let fixture: ComponentFixture<RiskMitigationTabScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskMitigationTabScreenComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RiskMitigationTabScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
