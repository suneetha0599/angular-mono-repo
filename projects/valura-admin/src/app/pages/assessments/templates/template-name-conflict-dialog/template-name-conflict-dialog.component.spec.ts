import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateNameConflictDialogComponent } from './template-name-conflict-dialog.component';

describe('TemplateNameConflictDialogComponent', () => {
  let component: TemplateNameConflictDialogComponent;
  let fixture: ComponentFixture<TemplateNameConflictDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateNameConflictDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateNameConflictDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
