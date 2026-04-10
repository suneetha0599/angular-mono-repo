import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailConfigurationCreateComponent } from './email-configuration-create.component';

describe('EmailConfigurationCreateComponent', () => {
  let component: EmailConfigurationCreateComponent;
  let fixture: ComponentFixture<EmailConfigurationCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailConfigurationCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailConfigurationCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
