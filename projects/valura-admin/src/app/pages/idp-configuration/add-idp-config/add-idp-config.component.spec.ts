import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddIdpComponent } from './add-idp-config.component';


describe('ClientDrawerComponent', () => {
  let component: AddIdpComponent;
  let fixture: ComponentFixture<AddIdpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddIdpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddIdpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
