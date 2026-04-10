import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoAuthComponent } from './sso-auth.component';

describe('SsoAuthComponent', () => {
  let component: SsoAuthComponent;
  let fixture: ComponentFixture<SsoAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SsoAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SsoAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
