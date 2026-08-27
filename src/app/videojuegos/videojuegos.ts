import { Component, OnInit, inject } from '@angular/core';
import { ServicioApiBebida } from '../servicios/servicio-api-bebida';
import { ServicioApiComida } from '../servicios/servicio-api-comida';

@Component({
  selector: 'app-videojuegos',
  imports: [],
  templateUrl: './videojuegos.html',
  styleUrl: './videojuegos.css',
})
export class Videojuegos implements OnInit {
  private apiComida = inject(ServicioApiComida);
  private apiBebida = inject(ServicioApiBebida);

  posComida: number = 0;
  posBebida: number = 0;
  imagenComida: string = '';
  imagenBebida: string = '';
  mensaje: string = '';
  comidaEncontrada: boolean = false;
  bebidaEncontrada: boolean = false;

  ngOnInit(): void {
    this.comidaEncontrada = false;
    this.bebidaEncontrada = false;
    this.mensaje = '';

    this.posComida = Math.floor(Math.random() * 16) + 1;
    this.posBebida = Math.floor(Math.random() * 16) + 1;
    if (this.posBebida == this.posComida) {
      this.posBebida = Math.floor(Math.random() * 16) + 1;
    }

    this.apiComida.comidaAleatoria().subscribe((respuesta) => {
      this.imagenComida = respuesta.meals[0].strMealThumb;
    });

    this.apiBebida.bebidaAleatoria().subscribe((respuesta) => {
      this.imagenBebida = respuesta.drinks[0].strDrinkThumb;
    });
  }

  descubrir(p: number) {
    const carta = document.getElementById('carta' + p) as HTMLImageElement;

    if (carta.classList.contains('volteada')) {
      return;
    }

    carta.classList.add('volteada');

    if (p == this.posComida) {
      carta.src = this.imagenComida;
      carta.classList.add('encontrada');
      this.comidaEncontrada = true;
    } else if (p == this.posBebida) {
      carta.src = this.imagenBebida;
      carta.classList.add('encontrada');
      this.bebidaEncontrada = true;
    } else {
      carta.src = 'respuesta.jpeg';
    }

    if (this.comidaEncontrada && this.bebidaEncontrada) {
      this.mensaje = '¡Ganaste!';
    }
  }

  reiniciar() {
    for (let i = 1; i <= 16; i++) {
      const carta = document.getElementById('carta' + i) as HTMLImageElement;
      carta.src = 'muroNegro.jpeg';
      carta.classList.remove('volteada', 'encontrada');
    }
    this.ngOnInit();
  }
}