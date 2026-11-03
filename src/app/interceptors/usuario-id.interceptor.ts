import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { environment } from '../../environments/environment';

export const usuarioIdInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.getUser()?.token;
  const backend = new URL(environment.storageUrl);
  const destino = new URL(request.url, backend);
  const esBackend = destino.origin === backend.origin
    && (destino.pathname.startsWith('/api/v1/') || destino.pathname.startsWith('/uploads/'));
  const authenticated = token && esBackend && !request.headers.has('Authorization')
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;
  return next(authenticated).pipe(catchError((error) => {
    if (error.status === 401 && token && !request.url.includes('/auth/login')) {
      session.clearUser();
      router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};
