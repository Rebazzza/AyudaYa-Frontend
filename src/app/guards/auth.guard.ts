import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = (route): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isLoggedIn()) {
    return true;
  }

  const path = route.url.length > 0 ? `/${route.url.join('/')}` : '/';
  return router.createUrlTree(['/login'], { queryParams: { redirect: path } });
};

export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isLoggedIn()) {
    return router.createUrlTree(['/']);
  }

  return true;
};