import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationCreateComponent } from './regulation-create.component';

describe('RegulationCreateComponent', () => {
  let component: RegulationCreateComponent;
  let fixture: ComponentFixture<RegulationCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegulationCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegulationCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
