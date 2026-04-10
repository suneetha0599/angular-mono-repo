import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExportDrawerComponent } from './export-drawer.component';


describe('ExportDrawerComponent', () => {
  let component: ExportDrawerComponent;
  let fixture: ComponentFixture<ExportDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
