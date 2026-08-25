import { TestBed } from '@angular/core/testing';

import { ServicioApiComida } from './servicio-api-comida';

describe('ServicioApiComida', () => {
  let service: ServicioApiComida;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioApiComida);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
