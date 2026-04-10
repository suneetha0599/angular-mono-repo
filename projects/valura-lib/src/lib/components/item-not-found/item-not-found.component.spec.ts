import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemNotFoundComponent } from './item-not-found.component';

describe('ItemNotFoundComponent', () => {
  let component: ItemNotFoundComponent;
  let fixture: ComponentFixture<ItemNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemNotFoundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
