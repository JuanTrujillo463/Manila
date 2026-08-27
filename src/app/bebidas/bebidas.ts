import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioApiBebida } from '../servicios/servicio-api-bebida';
import { EnviarDatos } from '../servicios/enviar-datos';
import { Bebida } from '../entidades/bebida';

@Component({
  selector: 'app-bebidas',
  imports: [CommonModule, FormsModule],
  templateUrl: './bebidas.html',
  styleUrl: './bebidas.css',
})
export class Bebidas implements OnInit {

  private api = inject(ServicioApiBebida);
  private carrito = inject(EnviarDatos);

  tipoBusqueda = 'nombreCoctel';
  textoBusqueda = '';
  filtroTipo = '';
  filtroCategoria = '';

  bebidas = signal<Bebida[]>([]);
  precios = signal<{ [id: string]: number }>({});
  error = signal('');
  detalle = signal<Bebida | null>(null);

  mostrarConfirmacion = signal(false);
  private temporizadorConfirmacion?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.cargarTodas();
  }

  cargarTodas() {
    this.error.set('');
    this.bebidas.set([]);
    this.filtroTipo = '';
    this.filtroCategoria = '';

    this.api.bebidaPorTipo('Alcoholic').subscribe({
      next: (respuesta) => {
        let nuevas: Bebida[] = [];
        if (respuesta.drinks) {
          nuevas = respuesta.drinks;
        }
        this.agregarResultados(nuevas);
      },
    });

    this.api.bebidaPorTipo('Non_Alcoholic').subscribe({
      next: (respuesta) => {
        let nuevas: Bebida[] = [];
        if (respuesta.drinks) {
          nuevas = respuesta.drinks;
        }
        this.agregarResultados(nuevas);
      },
    });
  }

  buscar() {
    this.error.set('');

    const texto = this.textoBusqueda.trim();

    let usaIngredienteComoBase = false;
    if (texto.length > 0 && this.tipoBusqueda === 'nombreIngrediente') {
      usaIngredienteComoBase = true;
    }

    if (!usaIngredienteComoBase && !this.filtroTipo && !this.filtroCategoria && !texto) {
      this.error.set('Escribe un texto o selecciona un filtro para buscar.');
      this.bebidas.set([]);
      return;
    }

    let peticion;
    let necesitaDetalle = false;
    const filtrosPendientes: Array<'nombre' | 'tipo' | 'categoria'> = [];

    if (usaIngredienteComoBase) {
      const ingredienteFormateado = texto.replace(/ /g, '_');
      peticion = this.api.bebidaPorIngrediente(ingredienteFormateado);
      necesitaDetalle = true;
      if (this.filtroTipo) filtrosPendientes.push('tipo');
      if (this.filtroCategoria) filtrosPendientes.push('categoria');
    } else if (this.filtroTipo) {
      peticion = this.api.bebidaPorTipo(this.filtroTipo);
      necesitaDetalle = true;
      if (texto) filtrosPendientes.push('nombre');
      if (this.filtroCategoria) filtrosPendientes.push('categoria');
    } else if (this.filtroCategoria) {
      peticion = this.api.bebidaPorCategoria(this.filtroCategoria);
      necesitaDetalle = true;
      if (texto) filtrosPendientes.push('nombre');
    } else {
      peticion = this.api.recibirDatosBebida(texto);
      filtrosPendientes.push('nombre');
    }

    peticion.subscribe({next: (respuesta) => {
        let base: Bebida[] = [];
        if (respuesta.drinks) {
          base = respuesta.drinks;
        }

        if (base.length === 0) {
          this.bebidas.set([]);
          this.error.set('No se encontraron resultados.');
          return;
        }

        if (necesitaDetalle && filtrosPendientes.length > 0) {
          this.completarYFiltrar(base, texto, filtrosPendientes);
        } else if (filtrosPendientes.length > 0) {
          this.aplicarFiltrosYMostrar(base, texto, filtrosPendientes);
        } else {
          this.bebidas.set(base);
          this.asignarPrecios();
        }
      },
      error: () => {
        this.bebidas.set([]);
        this.error.set('Ocurrió un error al buscar. Intenta de nuevo.');
      },
    });
  }

  private completarYFiltrar(base: Bebida[], texto: string, filtrosPendientes: Array<'nombre' | 'tipo' | 'categoria'>) {
    const completos: Bebida[] = [];
    let recibidas = 0;

    const contarRespuesta = () => {
      recibidas++;
      if (recibidas === base.length) {
        this.aplicarFiltrosYMostrar(completos, texto, filtrosPendientes);
      }
    };

    for (const bebida of base) {
      this.api.bebidaPorId(bebida.idDrink).subscribe({
        next: (respuesta) => {
          let detalle: Bebida | null = null;
          if (respuesta.drinks && respuesta.drinks[0]) {
            detalle = respuesta.drinks[0];
          }
          if (detalle) {
            completos.push(detalle);
          }
          contarRespuesta();
        },
        error: () => {
          contarRespuesta();
        },
      });
    }
  }

  private aplicarFiltrosYMostrar(lista: Bebida[], texto: string, filtrosPendientes: Array<'nombre' | 'tipo' | 'categoria'>) {
    let resultado = lista;

    if (filtrosPendientes.includes('nombre')) {

      const palabrasEscritas = texto.toLowerCase().split(' ');
      const palabras: string[] = [];
      for (const palabra of palabrasEscritas) {
        if (palabra.length > 0) {
          palabras.push(palabra);
        }
      }

      const resultadoFiltradoPorNombre: Bebida[] = [];
      for (const bebida of resultado) {
        const nombre = bebida.strDrink.toLowerCase();

        let coincide = false;
        for (const palabra of palabras) {
          if (nombre.includes(palabra)) {
            coincide = true;
          }
        }

        if (coincide) {
          resultadoFiltradoPorNombre.push(bebida);
        }
      }

      resultado = resultadoFiltradoPorNombre;
    }

    if (filtrosPendientes.includes('tipo')) {
      const resultadoFiltradoPorTipo: Bebida[] = [];

      for (const bebida of resultado) {
        let tipoBebida = '';
        if (bebida.strAlcoholic) {
          tipoBebida = bebida.strAlcoholic;
        }

        if (tipoBebida.replace(/ /g, '_') === this.filtroTipo) {
          resultadoFiltradoPorTipo.push(bebida);
        }
      }

      resultado = resultadoFiltradoPorTipo;
    }

    if (filtrosPendientes.includes('categoria')) {
      const resultadoFiltradoPorCategoria: Bebida[] = [];

      for (const bebida of resultado) {
        let categoriaBebida = '';
        if (bebida.strCategory) {
          categoriaBebida = bebida.strCategory;
        }

        if (categoriaBebida.replace(/ /g, '_') === this.filtroCategoria) {
          resultadoFiltradoPorCategoria.push(bebida);
        }
      }

      resultado = resultadoFiltradoPorCategoria;
    }

    this.bebidas.set(resultado);
    this.asignarPrecios();

    if (resultado.length === 0) {
      this.error.set('No se encontraron resultados.');
    }
  }

  agregarAlPedido(bebida: Bebida) {
    this.carrito.agregarItem({
      id: bebida.idDrink,
      tipo: 'bebida',
      nombre: bebida.strDrink,
      imagen: bebida.strDrinkThumb,
      precio: this.precios()[bebida.idDrink],
      cantidad: 1,
    });

    this.mostrarConfirmacion.set(true);
    clearTimeout(this.temporizadorConfirmacion);
    this.temporizadorConfirmacion = setTimeout(() => {this.mostrarConfirmacion.set(false); }, 2000);
  }

  verDetalle(bebida: Bebida) {
    this.api.bebidaPorId(bebida.idDrink).subscribe({
      next: (respuesta) => {

        let detalleCompleto = bebida;
        if (respuesta.drinks && respuesta.drinks[0]) {
          detalleCompleto = respuesta.drinks[0];
        }

        detalleCompleto.ingredientes = this.api.armarIngredientes(detalleCompleto);
        this.detalle.set(detalleCompleto);
      },
    });
  }

  cerrarDetalle() {
    this.detalle.set(null);
  }

  volverArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private agregarResultados(nuevas: Bebida[]) {
    const listaActual = this.bebidas();
    const listaCompleta = listaActual.concat(nuevas);
    this.bebidas.set(listaCompleta);
    this.asignarPrecios();
  }

  private asignarPrecios() {
    const preciosActuales = Object.assign({}, this.precios());

    for (const bebida of this.bebidas()) {
      const id = bebida.idDrink;
      if (!preciosActuales[id]) {
        preciosActuales[id] = this.api.asignarPrecioAleatorio();
      }
    }

    this.precios.set(preciosActuales);
  }
}