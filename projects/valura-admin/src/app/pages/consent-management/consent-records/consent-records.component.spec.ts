import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentRecordsComponent } from './consent-records.component';

describe('ConsentRecordsComponent', () => {
  let component: ConsentRecordsComponent;
  let fixture: ComponentFixture<ConsentRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentRecordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
