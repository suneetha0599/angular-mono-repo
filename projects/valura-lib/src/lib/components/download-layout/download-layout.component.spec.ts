import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadLayoutComponent } from './download-layout.component';

describe('DownloadLayoutComponent', () => {
  let component: DownloadLayoutComponent;
  let fixture: ComponentFixture<DownloadLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
