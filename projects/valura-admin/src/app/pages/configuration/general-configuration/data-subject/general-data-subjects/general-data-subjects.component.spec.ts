import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralDataSubjectsComponent } from './general-data-subjects.component';

describe('GeneralDataSubjectsComponent', () => {
  let component: GeneralDataSubjectsComponent;
  let fixture: ComponentFixture<GeneralDataSubjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralDataSubjectsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralDataSubjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
