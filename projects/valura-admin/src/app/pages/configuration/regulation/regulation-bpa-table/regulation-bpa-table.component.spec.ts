import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationBpaTableComponent } from './regulation-bpa-table.component';

describe('RegulationBpaTableComponent', () => {
  let component: RegulationBpaTableComponent;
  let fixture: ComponentFixture<RegulationBpaTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegulationBpaTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegulationBpaTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
