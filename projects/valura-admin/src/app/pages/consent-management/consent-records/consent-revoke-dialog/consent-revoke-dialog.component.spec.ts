import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentRevokeDialogComponent } from './consent-revoke-dialog.component';

describe('ConsentRevokeDialogComponent', () => {
  let component: ConsentRevokeDialogComponent;
  let fixture: ComponentFixture<ConsentRevokeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentRevokeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentRevokeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
