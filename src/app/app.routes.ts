import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
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
    path: 'locales/nuevo',
    loadComponent: () =>
      import('./pages/local-form/local-form').then((m) => m.LocalFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'locales/:id',
    loadComponent: () =>
      import('./pages/local-detail/local-detail').then((m) => m.LocalDetailComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];