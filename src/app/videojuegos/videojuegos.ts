import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioApiBebida } from '../servicios/servicio-api-bebida';
import { ServicioApiComida } from '../servicios/servicio-api-comida';

interface Carta {
  id: number;
  imagen: string;
  volteada: boolean;
  encontrada: boolean;
}

const pareja = 4;
const espera = 900;

@Component({
  selector: 'app-videojuegos',
  imports: [CommonModule],
  templateUrl: './videojuegos.html',
  styleUrl: './videojuegos.css',
})
export class Videojuegos implements OnInit {
  private apiComida = inject(ServicioApiComida);
  private apiBebida = inject(ServicioApiBebida);

  cartas = signal<Carta[]>([]);
  cargando = signal(true);
  intentos = signal(0);
  juegoTerminado = signal(false);

  private primeraCarta: Carta | null = null;
  private bloqueado = false;
  private imagenesCargadas: string[] = [];
  private peticionesPendientes = 0;

  ngOnInit() {
    this.iniciarJuego();
  }

    iniciarJuego() {
    this.cargando.set(true);
    this.juegoTerminado.set(false);
    this.intentos.set(0);

    this.imagenesCargadas = [];
    this.peticionesPendientes = pareja * 2;

    for (let i = 0; i < pareja; i++) {
      this.pedirComidaUnica();
      this.pedirBebidaUnica();
    }
  }

  private pedirComidaUnica() {
    this.apiComida.comidaAleatoria().subscribe((respuesta) => {
      const imagen = respuesta.meals[0].strMealThumb;
      if (this.imagenesCargadas.includes(imagen)) {
        this.pedirComidaUnica();
        return;
      }
      this.imagenesCargadas.push(imagen);
      this.revisarSiYaCargaronTodas();
    });
  }

  private pedirBebidaUnica() {
    this.apiBebida.bebidaAleatoria().subscribe((respuesta) => {
      const imagen = respuesta.drinks[0].strDrinkThumb;
      if (this.imagenesCargadas.includes(imagen)) {
        this.pedirBebidaUnica();
        return;
      }
      this.imagenesCargadas.push(imagen);
      this.revisarSiYaCargaronTodas();
    });
  }

  voltearCarta(carta: Carta) {
    if (this.bloqueado || carta.volteada || carta.encontrada) {
      return;
    }

    this.actualizarCarta(carta.id, { volteada: true });

    if (!this.primeraCarta) {
      this.primeraCarta = { ...carta, volteada: true };
      return;
    }

    this.intentos.update((valor) => valor + 1);

    if (this.primeraCarta.imagen === carta.imagen) {
      this.actualizarCarta(this.primeraCarta.id, { encontrada: true });
      this.actualizarCarta(carta.id, { encontrada: true });
      this.primeraCarta = null;
      this.revisarSiTermino();
    } else {
      this.bloqueado = true;
      const idPrimera = this.primeraCarta.id;
      const idSegunda = carta.id;
      setTimeout(() => {
        this.actualizarCarta(idPrimera, { volteada: false });
        this.actualizarCarta(idSegunda, { volteada: false });
        this.primeraCarta = null;
        this.bloqueado = false;
      }, espera);
    }
  }

  private revisarSiYaCargaronTodas() {
    this.peticionesPendientes--;
    if (this.peticionesPendientes > 0) {
      return;
    }

    const parejas = [...this.imagenesCargadas, ...this.imagenesCargadas];
    const mezcladas = parejas.sort(() => Math.random() - 0.5);

    this.cartas.set(
      mezcladas.map((imagen, indice) => ({
        id: indice,
        imagen,
        volteada: false,
        encontrada: false,
      }))
    );

    this.cargando.set(false);
  }

  private actualizarCarta(id: number, cambios: Partial<Carta>) {
    this.cartas.update((lista) => lista.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
  }

  private revisarSiTermino() {
    this.juegoTerminado.set(this.cartas().every((c) => c.encontrada));
  }
}
