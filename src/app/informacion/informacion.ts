import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioApiBebida } from '../servicios/servicio-api-bebida';
import { ServicioApiComida } from '../servicios/servicio-api-comida';
import { Comida } from '../entidades/comida';
import { Bebida } from '../entidades/bebida';

const id_Plato = '52772';
const id_Bebida = '11007';

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
    this.apiComida.comidaPorId(id_Plato).subscribe((respuesta) => {
      this.platoEstrella.set(respuesta.meals ? respuesta.meals[0] : null);
    });

    this.apiBebida.bebidaPorId(id_Bebida).subscribe((respuesta) => {
      this.bebidaEstrella.set(respuesta.drinks ? respuesta.drinks[0] : null);
    });
  }
}
