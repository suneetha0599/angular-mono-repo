import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskDialogComponent } from './risk-dialog.component';

describe('RiskDialogComponent', () => {
  let component: RiskDialogComponent;
  let fixture: ComponentFixture<RiskDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
