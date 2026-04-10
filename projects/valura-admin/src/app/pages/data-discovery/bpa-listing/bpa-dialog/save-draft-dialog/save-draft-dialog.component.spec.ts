import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveDraftDialogComponent } from './save-draft-dialog.component';

describe('SaveDraftDialogComponent', () => {
  let component: SaveDraftDialogComponent;
  let fixture: ComponentFixture<SaveDraftDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveDraftDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveDraftDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
