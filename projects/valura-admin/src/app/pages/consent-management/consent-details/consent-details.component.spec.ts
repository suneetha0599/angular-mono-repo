import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentDetailsComponent } from './consent-details.component';

describe('ConsentDetailsComponent', () => {
  let component: ConsentDetailsComponent;
  let fixture: ComponentFixture<ConsentDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
