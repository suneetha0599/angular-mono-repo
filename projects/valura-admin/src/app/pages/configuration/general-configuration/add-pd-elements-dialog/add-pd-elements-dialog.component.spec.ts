import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPdElementsDialogComponent } from './add-pd-elements-dialog.component';

describe('AddPdElementsDialogComponent', () => {
  let component: AddPdElementsDialogComponent;
  let fixture: ComponentFixture<AddPdElementsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPdElementsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPdElementsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
