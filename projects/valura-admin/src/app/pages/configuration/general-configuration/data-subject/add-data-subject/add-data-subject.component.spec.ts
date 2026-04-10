import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDataSubjectComponent } from './add-data-subject.component';

describe('AddDataSubjectComponent', () => {
  let component: AddDataSubjectComponent;
  let fixture: ComponentFixture<AddDataSubjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDataSubjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDataSubjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
