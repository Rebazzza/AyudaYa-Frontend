import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer.component';
import { BarraAccesibilidadComponent } from './shared/components/barra-accesibilidad/barra-accesibilidad';
import { ApiTimeoutNoticeService } from './services/api-timeout-notice.service';
import { NavigationTimingService } from './routing/navigation-timing.service';

@Component({
  imports: [RouterOutlet, NavbarComponent, FooterComponent, BarraAccesibilidadComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  template: `
    <div class="min-h-screen flex flex-col">
      <app-navbar />
      @if (timeoutNotice.message()) {
        <div role="alert" class="mx-auto mt-3 flex w-full max-w-5xl items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span>{{ timeoutNotice.message() }}</span>
          <button type="button" class="font-semibold underline" (click)="timeoutNotice.dismiss()">Cerrar</button>
        </div>
      }
      <div class="flex-1">
        <router-outlet />
      </div>
      @if (initialNavigationComplete()) {
        <app-footer />
      }
      <app-barra-accesibilidad />
    </div>
  `,
})
export class App {
  readonly timeoutNotice = inject(ApiTimeoutNoticeService);
  private readonly navigationTiming = inject(NavigationTimingService);
  private readonly router = inject(Router);
  readonly initialNavigationComplete = signal(this.router.navigated);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => this.initialNavigationComplete.set(true));
  }
}
