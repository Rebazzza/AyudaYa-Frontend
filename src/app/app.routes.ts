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
    path: 'locales/:id/editar',
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
    path: 'donaciones/mis-donaciones',
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
    path: 'donaciones/monetaria',
    loadComponent: () =>
      import('./pages/donacion-monetaria/donacion-monetaria').then((m) => m.DonacionMonetariaComponent),
    canActivate: [authGuard],
  },
  {
    path: 'donaciones/detalle/:id',
    loadComponent: () =>
      import('./pages/seguimientoDonación/seguimientoDonacion').then(
        (m) => m.SeguimientoDonacionComponent,
      ),
    canActivate: [authGuard],
  },
  {
    // Alias: enlaces antiguos usaban /donaciones/:id; sin esta ruta caían en el
    // comodín ** y redirigían al dashboard.
    path: 'donaciones/:id',
    loadComponent: () =>
      import('./pages/seguimientoDonación/seguimientoDonacion').then(
        (m) => m.SeguimientoDonacionComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tracking',
    loadComponent: () =>
      import('./pages/seguimientoDonación/seguimientoDonacion').then(
        (m) => m.SeguimientoDonacionComponent,
      ),
    // TC-FUNC-10: el rastreo público NO exige sesión; cualquier visitante puede
    // consultar la línea de tiempo con el código de seguimiento.
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
    path: 'almacen/kits',
    loadComponent: () =>
      import('./features/almacen/pages/armar-kits/armar-kits').then((m) => m.ArmarKitsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'predicciones/escasez',
    loadComponent: () =>
      import('./features/predicciones/pages/panel-escasez-page/panel-escasez-page').then(
        (m) => m.PanelEscasezPageComponent,
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'verificar-fondos',
    loadComponent: () =>
      import('./pages/verificar-fondos/verificar-fondos').then((m) => m.VerificarFondosComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'fondos/panel',
    loadComponent: () =>
      import('./pages/panel-fondos/panel-fondos').then((m) => m.PanelFondosComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'kits/seguimiento',
    loadComponent: () =>
      import('./pages/seguimiento-kit/seguimiento-kit').then((m) => m.SeguimientoKitComponent),
    canActivate: [authGuard],
  },
  {
    path: 'campanas',
    loadComponent: () =>
      import('./pages/campanas/campanas').then((m) => m.CampanasComponent),
    canActivate: [authGuard, adminGuard],
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
    path: 'auditoria',
    loadComponent: () =>
      import('./pages/auditoria/auditoria').then((m) => m.AuditoriaComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./pages/notificaciones/notificaciones').then((m) => m.NotificacionesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'logistica/lotes',
    loadComponent: () =>
      import('./features/logistica/pages/lotes-page/lotes-page').then(
        (m) => m.LotesPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'logistica/lotes/:id',
    loadComponent: () =>
      import('./features/logistica/pages/hoja-ruta-page/hoja-ruta-page').then(
        (m) => m.HojaRutaPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];