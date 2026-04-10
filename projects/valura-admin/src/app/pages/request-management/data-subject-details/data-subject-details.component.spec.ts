import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSubjectDetailsComponent } from './data-subject-details.component';

describe('DataSubjectDetailsComponent', () => {
  let component: DataSubjectDetailsComponent;
  let fixture: ComponentFixture<DataSubjectDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSubjectDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataSubjectDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
