import { TestBed } from '@angular/core/testing';

import { Matrix } from './matrix';

describe('Matrix', () => {
  let service: Matrix;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Matrix);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
