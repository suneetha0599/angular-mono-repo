import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataManagementScreenComponent } from './data-management-screen.component';

describe('DataManagementScreenComponent', () => {
  let component: DataManagementScreenComponent;
  let fixture: ComponentFixture<DataManagementScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataManagementScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataManagementScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
