import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityControlsTabComponent } from './security-controls-tab.component';

describe('SecurityAndRetentionTabComponent', () => {
  let component: SecurityControlsTabComponent;
  let fixture: ComponentFixture<SecurityControlsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityControlsTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityControlsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
