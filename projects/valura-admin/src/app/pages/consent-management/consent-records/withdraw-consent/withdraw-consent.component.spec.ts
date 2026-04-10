import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawConsentComponent } from './withdraw-consent.component';

describe('WithdrawConsentComponent', () => {
  let component: WithdrawConsentComponent;
  let fixture: ComponentFixture<WithdrawConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WithdrawConsentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WithdrawConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
