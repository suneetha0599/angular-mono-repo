import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegulationLegalBasisDialogComponent } from './regulation-legal-basis-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RegulationLegalBasisDialogComponent', () => {
  let component: RegulationLegalBasisDialogComponent;
  let fixture: ComponentFixture<RegulationLegalBasisDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegulationLegalBasisDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegulationLegalBasisDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
