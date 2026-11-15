import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, catchError, of, switchMap, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PriorityPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] !== true) return of(null);
    // Deja terminar la primera navegación antes de descargar vistas frecuentes.
    return timer(750).pipe(switchMap(load), catchError(() => of(null)));
  }
}
