import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaDrawerRecipientsComponent } from './bpa-drawer-recipients.component';

describe('BpaDrawerRecipientsComponent', () => {
  let component: BpaDrawerRecipientsComponent;
  let fixture: ComponentFixture<BpaDrawerRecipientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaDrawerRecipientsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaDrawerRecipientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
