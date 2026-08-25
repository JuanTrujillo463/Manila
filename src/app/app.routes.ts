import { Routes } from '@angular/router';
import { Comida } from './comida/comida';
import { Bebidas } from './bebidas/bebidas';
import { Videojuegos } from './videojuegos/videojuegos';
import { Pedido } from './pedido/pedido';

export const routes: Routes = [
  { path: 'comida', component: Comida },
  { path: 'bebidas', component: Bebidas },
  { path: 'videojuegos', component: Videojuegos },
  { path: 'pedido', component: Pedido },
  { path: '**', redirectTo: '' },
];
