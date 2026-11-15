import { Injectable, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

const NAVIGATION_BUDGET_MS = 3_000;

@Injectable({ providedIn: 'root' })
export class NavigationTimingService {
  private readonly router = inject(Router);
  private readonly started = new Map<number, number>();
  readonly lastNavigationMs = signal<number | null>(null);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.started.set(event.id, performance.now());
      if (event instanceof NavigationCancel || event instanceof NavigationError) this.started.delete(event.id);
      if (event instanceof NavigationEnd) {
        const start = this.started.get(event.id);
        this.started.delete(event.id);
        if (start === undefined) return;
        // Dos frames incluyen la aplicación de la vista y el siguiente pintado visible.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (document.visibilityState !== 'visible') return;
          const duration = performance.now() - start;
          this.lastNavigationMs.set(duration);
          performance.measure('ayudaya:navigation', { start, end: performance.now() });
          if (duration >= NAVIGATION_BUDGET_MS) {
            console.warn(`La navegación a ${event.urlAfterRedirects} tardó ${Math.round(duration)} ms`);
          }
        }));
      }
    });
  }
}
