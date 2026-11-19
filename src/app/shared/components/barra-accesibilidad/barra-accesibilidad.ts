import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal as toSignalObservable } from '@angular/core/rxjs-interop';
import { AccesibilidadService, TamanoFuente } from '../../../core/services/accesibilidad.service';

type ClaveInterruptor =
  | 'contrasteEquilibrado'
  | 'daltonismo'
  | 'narracionActiva'
  | 'dislexia'
  | 'sinTransparencias';

@Component({
  selector: 'app-barra-accesibilidad',
  standalone: true,
  templateUrl: './barra-accesibilidad.html',
  styleUrl: './barra-accesibilidad.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraAccesibilidadComponent {
  private readonly accesibilidad = inject(AccesibilidadService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly config = toSignalObservable(this.accesibilidad.config$, {
    initialValue: this.accesibilidad.configActual,
  });

  readonly leyendo = toSignalObservable(this.accesibilidad.leyendo$, {
    initialValue: false,
  });

  readonly panelAbierto = signal(false);

  /** Texto anunciado por la región role="status" del panel (WCAG 2.2 · 4.1.3). */
  readonly aviso = signal('');

  readonly etiquetaFuente = computed(() => {
    switch (this.config().tamanoFuente) {
      case 'grande':
        return 'Grande (112 %)';
      case 'extra':
        return 'Extra (125 %)';
      default:
        return 'Normal (100 %)';
    }
  });

  get soportaNarracion(): boolean {
    return this.accesibilidad.soportaNarracion;
  }

  alternarPanel(): void {
    if (this.panelAbierto()) {
      this.cerrarPanel(false);
      return;
    }

    this.panelAbierto.set(true);
    setTimeout(() => {
      this.host.nativeElement.querySelector<HTMLElement>('[data-acc-primer]')?.focus();
    }, 0);
  }

  cerrarPanel(devolverFoco = false): void {
    if (!this.panelAbierto()) return;
    this.panelAbierto.set(false);
    if (devolverFoco) {
      this.host.nativeElement.querySelector<HTMLElement>('.acc-fab')?.focus();
    }
  }

  /** Limpia y vuelve a fijar el texto para que se reanuncien mensajes iguales. */
  private anunciar(mensaje: string): void {
    this.aviso.set('');
    setTimeout(() => this.aviso.set(mensaje), 0);
  }

  alternar(campo: ClaveInterruptor): void {
    const actual = this.config()[campo];
    switch (campo) {
      case 'contrasteEquilibrado':
        this.accesibilidad.actualizarConfig({ contrasteEquilibrado: !actual });
        break;
      case 'daltonismo':
        this.accesibilidad.actualizarConfig({ daltonismo: !actual });
        break;
      case 'narracionActiva':
        this.accesibilidad.actualizarConfig({ narracionActiva: !actual });
        if (!actual) {
          this.accesibilidad.narrar(
            'Narración de voz activada. Los elementos principales se leerán al enfocarlos o seleccionarlos.',
            true,
          );
        }
        break;
      case 'dislexia':
        this.accesibilidad.actualizarConfig({ dislexia: !actual });
        break;
      case 'sinTransparencias':
        this.accesibilidad.actualizarConfig({ sinTransparencias: !actual });
        break;
    }

    const etiquetas: Record<ClaveInterruptor, string> = {
      contrasteEquilibrado: 'Contrastes visuales equilibrados',
      daltonismo: 'Modo daltonismo',
      narracionActiva: 'Narración de voz',
      dislexia: 'Modo dislexia',
      sinTransparencias: 'Eliminar transparencias',
    };
    this.anunciar(`${etiquetas[campo]} ${this.config()[campo] ? 'activado' : 'desactivado'}.`);
  }

  cambiarFuente(tamano: TamanoFuente): void {
    this.accesibilidad.actualizarConfig({ tamanoFuente: tamano });
    this.anunciar(`Tamaño de texto: ${this.etiquetaFuente()}.`);
  }

  restablecer(): void {
    this.accesibilidad.restablecer();
    this.anunciar('Preferencias de accesibilidad restablecidas.');
  }

  leerPagina(): void {
    const seleccion = window.getSelection()?.toString().replace(/\s+/g, ' ').trim();
    let texto = seleccion ?? '';

    if (!texto) {
      const contenedor =
        document.querySelector<HTMLElement>('main') ??
        document.querySelector<HTMLElement>('app-root');

      if (contenedor) {
        const copia = contenedor.cloneNode(true) as HTMLElement;
        copia
          .querySelectorAll(
            'app-navbar, app-footer, app-barra-accesibilidad, script, style, noscript, [aria-hidden="true"]',
          )
          .forEach((nodo) => nodo.remove());
        texto = (copia.textContent ?? '').replace(/\s+/g, ' ').trim();
      }
    }

    this.accesibilidad.narrar(texto || 'No se encontró contenido para leer en esta página.', true);
  }

  detenerLectura(): void {
    this.accesibilidad.detenerLectura();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.panelAbierto()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cerrarPanel(true);
      return;
    }

    if (event.key === 'Tab') {
      this.mantenerFocoEnPanel(event);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.panelAbierto()) return;
    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) return;
    this.cerrarPanel(false);
  }

  private mantenerFocoEnPanel(event: KeyboardEvent): void {
    const enfocables = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (enfocables.length === 0) return;

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    const activo = document.activeElement as HTMLElement | null;

    if (!activo || !this.host.nativeElement.contains(activo)) {
      event.preventDefault();
      primero.focus();
      return;
    }

    if (event.shiftKey && activo === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && activo === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }
}
