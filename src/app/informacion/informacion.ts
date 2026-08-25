import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioApiBebida } from '../servicios/servicio-api-bebida';
import { ServicioApiComida } from '../servicios/servicio-api-comida';
import { Comida } from '../entidades/comida';
import { Bebida } from '../entidades/bebida';

const ID_PLATO_ESTRELLA = '52772';
const ID_BEBIDA_ESTRELLA = '11007';

@Component({
  selector: 'app-informacion',
  imports: [CommonModule],
  templateUrl: './informacion.html',
  styleUrl: './informacion.css',
})
export class Informacion implements OnInit {
  private apiComida = inject(ServicioApiComida);
  private apiBebida = inject(ServicioApiBebida);

  platoEstrella = signal<Comida | null>(null);
  bebidaEstrella = signal<Bebida | null>(null);

  ngOnInit() {
    this.apiComida.comidaPorId(ID_PLATO_ESTRELLA).subscribe((respuesta) => {
      this.platoEstrella.set(respuesta.meals ? respuesta.meals[0] : null);
    });

    this.apiBebida.bebidaPorId(ID_BEBIDA_ESTRELLA).subscribe((respuesta) => {
      this.bebidaEstrella.set(respuesta.drinks ? respuesta.drinks[0] : null);
    });
  }
}
