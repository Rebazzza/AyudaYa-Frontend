import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

/**
 * RF45: identifica al usuario autenticado en cada peticion para que el backend
 * pueda registrar el audit trail incluso cuando la operacion no recibe el id
 * como parametro explicito.
 */
export const usuarioIdInterceptor: HttpInterceptorFn = (request, next) => {
  const usuario = inject(SessionService).getUser();
  if (!usuario?.idUsuario) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { 'X-Usuario-Id': String(usuario.idUsuario) },
    }),
  );
};
