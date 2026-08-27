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
      next: (respuesta) => this.agregarResultados(respuesta.drinks ?? []),
    });

    this.api.bebidaPorTipo('Non_Alcoholic').subscribe({
      next: (respuesta) => this.agregarResultados(respuesta.drinks ?? []),
    });
  }

  buscar() {
    this.error.set('');

    const texto = this.textoBusqueda.trim();
    const usaIngredienteComoBase = !!texto && this.tipoBusqueda === 'nombreIngrediente';

    if (!usaIngredienteComoBase && !this.filtroTipo && !this.filtroCategoria && !texto) {
      this.error.set('Escribe un texto o selecciona un filtro para buscar.');
      this.bebidas.set([]);
      return;
    }

    let peticion;
    let necesitaDetalle = false;
    const filtrosPendientes: Array<'nombre' | 'tipo' | 'categoria'> = [];

    // Se elige la petición base con el criterio más restrictivo disponible;
    // los demás filtros activos se aplican después sobre esos resultados.
    if (usaIngredienteComoBase) {
      // La API necesita los ingredientes de varias palabras con "_" en vez de espacio
      // (ej: "Orange Juice" -> "Orange_Juice"), si no, no encuentra coincidencias.
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
      // Búsqueda por nombre: search.php ya trae todos los datos, no hace
      // falta pedir el detalle de cada bebida por aparte.
      peticion = this.api.recibirDatosBebida(texto);
      filtrosPendientes.push('nombre');
    }

    peticion.subscribe({
      next: (respuesta) => {
        const base = respuesta.drinks ?? [];

        if (base.length === 0) {
          this.bebidas.set([]);
          this.error.set('No se encontraron resultados.');
          return;
        }

        // filter.php solo devuelve id/nombre/imagen. Si hace falta aplicar
        // más filtros (nombre, tipo o categoría), se piden los datos completos.
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

  private completarYFiltrar(
    base: Bebida[],
    texto: string,
    filtrosPendientes: Array<'nombre' | 'tipo' | 'categoria'>
  ) {
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
          const detalle = respuesta.drinks?.[0];
          if (detalle) {
            completos.push(detalle);
          }
          contarRespuesta();
        },
        error: () => {
          // Si una petición falla, la contamos igual para no dejar
          // el buscador esperando para siempre.
          contarRespuesta();
        },
      });
    }
  }
  private aplicarFiltrosYMostrar(
    lista: Bebida[],
    texto: string,
    filtrosPendientes: Array<'nombre' | 'tipo' | 'categoria'>
  ) {
    let resultado = lista;

    if (filtrosPendientes.includes('nombre')) {
  // Se separa el texto escrito en palabras sueltas: si el nombre de la
  // bebida contiene AL MENOS UNA de esas palabras, se considera coincidencia.
  // Así no hace falta escribir el nombre completo o en orden exacto.
  const palabras = texto
    .toLowerCase()
    .split(' ')
    .filter((palabra) => palabra.length > 0);

  resultado = resultado.filter((b) => {
    const nombre = b.strDrink.toLowerCase();
    return palabras.some((palabra) => nombre.includes(palabra));
      });
    }

    if (filtrosPendientes.includes('tipo')) {
      resultado = resultado.filter((b) => (b.strAlcoholic ?? '').replace(/ /g, '_') === this.filtroTipo);
    }

    if (filtrosPendientes.includes('categoria')) {
      resultado = resultado.filter(
        (b) => (b.strCategory ?? '').replace(/ /g, '_') === this.filtroCategoria
      );
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
    this.temporizadorConfirmacion = setTimeout(() => this.mostrarConfirmacion.set(false), 2000);
  }

  verDetalle(bebida: Bebida) {
    this.api.bebidaPorId(bebida.idDrink).subscribe({
      next: (respuesta) => {
        const detalleCompleto = respuesta.drinks?.[0] ?? bebida;
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
    this.bebidas.set([...this.bebidas(), ...nuevas]);
    this.asignarPrecios();
  }

  private asignarPrecios() {
    const preciosActuales = { ...this.precios() };

    for (const bebida of this.bebidas()) {
      const id = bebida.idDrink;
      if (!preciosActuales[id]) {
        preciosActuales[id] = this.api.asignarPrecioAleatorio();
      }
    }

    this.precios.set(preciosActuales);
  }
}