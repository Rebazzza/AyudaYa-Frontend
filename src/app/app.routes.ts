import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/register/register').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'locales',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'locales/nuevo',
    loadComponent: () =>
      import('./pages/local-form/local-form').then((m) => m.LocalFormComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'locales/:id',
    loadComponent: () =>
      import('./pages/local-detail/local-detail').then((m) => m.LocalDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'donaciones',
    loadComponent: () =>
      import('./pages/donaciones/donaciones').then((m) => m.DonacionesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'donaciones/nueva',
    loadComponent: () =>
      import('./pages/donacion-form/donacion-form').then((m) => m.DonacionFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'donaciones/:id',
    loadComponent: () =>
      import('./pages/seguimientoDonación/seguimientoDonacion').then(
        (m) => m.SeguimientoDonacionComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'seguimiento',
    loadComponent: () =>
      import('./pages/seguimientoDonación/seguimientoDonacion').then(
        (m) => m.SeguimientoDonacionComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'almacen/verificar',
    loadComponent: () =>
      import('./features/almacen/pages/corroboracion-page/corroboracion-page').then(
        (m) => m.CorroboracionPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'almacen/inventario',
    loadComponent: () =>
      import('./features/almacen/pages/inventario-page/inventario-page').then(
        (m) => m.InventarioPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'almacen/etiquetas',
    loadComponent: () =>
      import('./features/almacen/pages/etiquetas-page/etiquetas-page').then(
        (m) => m.EtiquetasPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./pages/categorias/categorias').then((m) => m.CategoriasComponent),
    canActivate: [authGuard],
  },
  {
    path: 'trabajadores',
    loadComponent: () =>
      import('./pages/trabajadores/trabajadores').then((m) => m.TrabajadoresComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./pages/notificaciones/notificaciones').then((m) => m.NotificacionesComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];