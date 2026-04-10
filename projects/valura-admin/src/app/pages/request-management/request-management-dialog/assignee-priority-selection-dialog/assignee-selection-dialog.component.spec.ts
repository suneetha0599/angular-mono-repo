import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssigneeSelectionDialogComponent } from './assignee-selection-dialog.component';

describe('AssigneeSelectionDialogComponent', () => {
  let component: AssigneeSelectionDialogComponent;
  let fixture: ComponentFixture<AssigneeSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssigneeSelectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssigneeSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
