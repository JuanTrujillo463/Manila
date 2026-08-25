import { TestBed } from '@angular/core/testing';

import { ServicioApiBebida } from './servicio-api-bebida';

describe('ServicioApiBebida', () => {
  let service: ServicioApiBebida;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioApiBebida);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
