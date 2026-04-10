import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateConsentFormComponent } from './create-consent-form.component';

describe('CreateConsentFormComponent', () => {
  let component: CreateConsentFormComponent;
  let fixture: ComponentFixture<CreateConsentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateConsentFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateConsentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
