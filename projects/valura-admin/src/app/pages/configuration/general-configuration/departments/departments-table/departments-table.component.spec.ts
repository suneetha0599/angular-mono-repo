import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentsTableComponent } from './departments-table.component';

describe('DepartmentsTableComponent', () => {
  let component: DepartmentsTableComponent;
  let fixture: ComponentFixture<DepartmentsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
