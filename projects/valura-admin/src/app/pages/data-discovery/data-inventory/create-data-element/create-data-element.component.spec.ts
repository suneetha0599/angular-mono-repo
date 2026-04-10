import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDataElementComponent } from './create-data-element.component';

describe('CreateDataElementComponent', () => {
  let component: CreateDataElementComponent;
  let fixture: ComponentFixture<CreateDataElementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDataElementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDataElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
