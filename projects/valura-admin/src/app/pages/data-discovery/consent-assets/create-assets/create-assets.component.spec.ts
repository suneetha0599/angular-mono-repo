import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAssetsComponent } from './create-assets.component';

describe('CreateAssetsComponent', () => {
  let component: CreateAssetsComponent;
  let fixture: ComponentFixture<CreateAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAssetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
