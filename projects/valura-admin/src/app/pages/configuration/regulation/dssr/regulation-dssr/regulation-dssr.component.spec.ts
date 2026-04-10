import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationDssrComponent } from './regulation-dssr.component';

describe('RegulationDssrComponent', () => {
  let component: RegulationDssrComponent;
  let fixture: ComponentFixture<RegulationDssrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegulationDssrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegulationDssrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
