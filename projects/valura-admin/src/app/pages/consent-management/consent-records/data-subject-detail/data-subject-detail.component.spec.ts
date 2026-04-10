import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSubjectDetailComponent } from './data-subject-detail.component';

describe('DataSubjectDetailComponent', () => {
  let component: DataSubjectDetailComponent;
  let fixture: ComponentFixture<DataSubjectDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSubjectDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataSubjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
