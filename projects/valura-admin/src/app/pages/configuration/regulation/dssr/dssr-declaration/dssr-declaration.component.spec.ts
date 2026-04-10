import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DssrDeclarationComponent } from './dssr-declaration.component';

describe('DssrDeclarationComponent', () => {
  let component: DssrDeclarationComponent;
  let fixture: ComponentFixture<DssrDeclarationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DssrDeclarationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DssrDeclarationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
