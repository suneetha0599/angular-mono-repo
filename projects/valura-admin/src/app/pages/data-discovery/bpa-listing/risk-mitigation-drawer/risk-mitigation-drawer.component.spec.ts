import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiskMitigationDrawerComponent } from './risk-mitigation-drawer.component';


describe('RiskMitigationDrawerComponent', () => {
  let component: RiskMitigationDrawerComponent;
  let fixture: ComponentFixture<RiskMitigationDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskMitigationDrawerComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RiskMitigationDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
