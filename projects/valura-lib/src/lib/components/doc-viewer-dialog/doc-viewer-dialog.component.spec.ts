import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocViewerDialogComponent } from './doc-viewer-dialog.component';

describe('DocViewerDialogComponent', () => {
  let component: DocViewerDialogComponent;
  let fixture: ComponentFixture<DocViewerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocViewerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocViewerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
