import { TestBed } from '@angular/core/testing';
import { CreateBpaService } from './create-bpa.service';


describe('CreateBpaService', () => {
  let service: CreateBpaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreateBpaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
