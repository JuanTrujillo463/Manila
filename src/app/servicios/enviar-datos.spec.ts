import { TestBed } from '@angular/core/testing';

import { EnviarDatos } from './enviar-datos';

describe('EnviarDatos', () => {
  let service: EnviarDatos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnviarDatos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
