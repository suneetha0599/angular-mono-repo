import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailConfigurationListComponent } from './email-configuration-list.component';

describe('EmailConfigurationListComponent', () => {
  let component: EmailConfigurationListComponent;
  let fixture: ComponentFixture<EmailConfigurationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailConfigurationListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailConfigurationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
