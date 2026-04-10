import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationBpaComponent } from './regulation-bpa.component';

describe('RegulationBpaComponent', () => {
  let component: RegulationBpaComponent;
  let fixture: ComponentFixture<RegulationBpaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegulationBpaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegulationBpaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
