import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftPanelLoginPageComponent } from './left-panel-login-page.component';

describe('LeftPanelLoginPageComponent', () => {
  let component: LeftPanelLoginPageComponent;
  let fixture: ComponentFixture<LeftPanelLoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftPanelLoginPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeftPanelLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
