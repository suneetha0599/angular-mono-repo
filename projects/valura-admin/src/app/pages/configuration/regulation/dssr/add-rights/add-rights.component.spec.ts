import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRightsComponent } from './add-rights.component';

describe('AddRightsComponent', () => {
  let component: AddRightsComponent;
  let fixture: ComponentFixture<AddRightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRightsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddRightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
