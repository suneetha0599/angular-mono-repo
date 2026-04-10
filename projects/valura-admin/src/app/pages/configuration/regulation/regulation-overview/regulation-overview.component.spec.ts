import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationOverviewComponent } from './regulation-overview.component';

describe('RegulationOverviewComponent', () => {
  let component: RegulationOverviewComponent;
  let fixture: ComponentFixture<RegulationOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegulationOverviewComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RegulationOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
