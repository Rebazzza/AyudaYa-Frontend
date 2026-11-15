import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiTimeoutNoticeService } from '../services/api-timeout-notice.service';

export const API_TIMEOUT_MS = 30_000;

/** Límite total: incluye carga, procesamiento y descarga, incluso con eventos de progreso. */
export const apiTimeoutInterceptor: HttpInterceptorFn = (request, next) => {
  const notice = inject(ApiTimeoutNoticeService);
  const api = new URL(environment.apiUrl);
  const target = new URL(request.url, api);
  if (target.origin !== api.origin || !target.pathname.startsWith(`${api.pathname.replace(/\/$/, '')}/`)) {
    return next(request);
  }

  return new Observable<HttpEvent<unknown>>((subscriber) => {
    let subscription: Subscription | undefined;
    const timer = setTimeout(() => {
      notice.show();
      subscriber.error(new HttpErrorResponse({
        status: 504,
        statusText: 'Gateway Timeout',
        url: request.url,
        error: { message: 'La solicitud superó los 30 segundos. Verifica el resultado antes de reintentar.' },
      }));
      subscription?.unsubscribe();
    }, API_TIMEOUT_MS);

    subscription = next(request).subscribe({
      next: (event) => subscriber.next(event),
      error: (error) => {
        clearTimeout(timer);
        if (error instanceof HttpErrorResponse && error.status === 504) notice.show();
        subscriber.error(error);
      },
      complete: () => {
        clearTimeout(timer);
        subscriber.complete();
      },
    });

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  });
};
