import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  session = inject(SessionService);

  /** Clases del enlace de navegación de la sección activa (resaltado). */
  readonly claseEnlaceActivo = 'font-bold underline decoration-2 underline-offset-4';

  oculto = signal(false);
  menuAbierto = signal(false);

  private isDesktop = window.matchMedia('(min-width: 768px)').matches;
  private lastY = window.scrollY;

  @HostListener('window:scroll', [])
  onScroll() {
    const y = window.scrollY;
    if (this.isDesktop) {
      this.oculto.set(false);
    } else {
      this.oculto.set(!this.menuAbierto() && y > 80 && y > this.lastY);
    }
    this.lastY = y;
  }

  @HostListener('window:resize', [])
  onResize() {
    this.isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (this.isDesktop) {
      this.oculto.set(false);
      this.menuAbierto.set(false);
    }
  }

  toggleMenu() {
    this.menuAbierto.set(!this.menuAbierto());
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

  logout() {
    this.menuAbierto.set(false);
    this.session.clearUser();
    window.location.href = '/';
  }
}
