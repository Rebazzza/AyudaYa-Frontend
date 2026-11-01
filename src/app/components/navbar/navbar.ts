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

  /** Clases del enlace activo dentro de los desplegables. */
  readonly claseEnlaceMenuActivo = 'bg-[#FF7717]/10 font-semibold text-[#FF7717]';

  oculto = signal(false);
  menuAbierto = signal(false);

  /** Desplegable de escritorio abierto en este momento (solo uno a la vez). */
  desplegableActivo = signal<string | null>(null);
  /** Desplegable fijado con clic: permanece abierto hasta salir o abrir otro. */
  private desplegableFijado = signal<string | null>(null);

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

  abrirDesplegable(nombre: string) {
    this.desplegableFijado.set(null);
    this.desplegableActivo.set(nombre);
  }

  cerrarDesplegable(nombre: string) {
    if (this.desplegableFijado() === nombre) return;
    if (this.desplegableActivo() === nombre) this.desplegableActivo.set(null);
  }

  alternarDesplegable(nombre: string) {
    if (this.desplegableFijado() === nombre) {
      this.desplegableFijado.set(null);
      this.desplegableActivo.set(null);
      return;
    }
    this.desplegableFijado.set(nombre);
    this.desplegableActivo.set(nombre);
  }

  cerrarDesplegables() {
    this.desplegableFijado.set(null);
    this.desplegableActivo.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.nav-desplegable')) this.cerrarDesplegables();
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
