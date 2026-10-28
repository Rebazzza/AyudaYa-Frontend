import { Component, Signal, WritableSignal, computed, input, model } from '@angular/core';

export const TAMANO_PAGINA = 10;

export interface Paginacion<T> {
  items: Signal<T[]>;
  totalPaginas: Signal<number>;
  paginaActual: Signal<number>;
}

/**
 * Divide una señal de lista en páginas de `tamanoPagina` elementos.
 * `pagina` es la señal de página actual (base 0) controlada por la vista.
 */
export function paginar<T>(
  fuente: Signal<readonly T[]>,
  pagina: WritableSignal<number>,
  tamanoPagina = TAMANO_PAGINA,
): Paginacion<T> {
  const totalPaginas = computed(() => Math.max(1, Math.ceil(fuente().length / tamanoPagina)));
  const paginaActual = computed(() => Math.min(pagina(), totalPaginas() - 1));
  const items = computed(() => {
    const inicio = paginaActual() * tamanoPagina;
    return fuente().slice(inicio, inicio + tamanoPagina) as T[];
  });
  return { items, totalPaginas, paginaActual };
}

/**
 * Navegador de páginas reutilizable. Muestra "Anterior / Página X de Y / Siguiente"
 * con acceso a primera y última página. Solo aparece si hay más de una página.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPaginas() > 1) {
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span class="text-xs text-on-surface-variant">
          Mostrando {{ desde() }}–{{ hasta() }} de {{ total() }} {{ unidad() }}
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            (click)="ir(0)"
            [disabled]="paginaActual() === 0"
            class="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Primera página"
            aria-label="Primera página">
            <span class="material-symbols-outlined text-base">first_page</span>
          </button>
          <button
            type="button"
            (click)="ir(paginaActual() - 1)"
            [disabled]="paginaActual() === 0"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition disabled:opacity-40 disabled:cursor-not-allowed">
            <span class="material-symbols-outlined text-base">chevron_left</span>
            Anterior
          </button>
          <span class="px-2 text-xs text-on-surface-variant whitespace-nowrap">
            Página {{ paginaActual() + 1 }} de {{ totalPaginas() }}
          </span>
          <button
            type="button"
            (click)="ir(paginaActual() + 1)"
            [disabled]="paginaActual() >= totalPaginas() - 1"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition disabled:opacity-40 disabled:cursor-not-allowed">
            Siguiente
            <span class="material-symbols-outlined text-base">chevron_right</span>
          </button>
          <button
            type="button"
            (click)="ir(totalPaginas() - 1)"
            [disabled]="paginaActual() >= totalPaginas() - 1"
            class="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Última página"
            aria-label="Última página">
            <span class="material-symbols-outlined text-base">last_page</span>
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  total = input.required<number>();
  tamanoPagina = input(TAMANO_PAGINA);
  unidad = input('registros');
  pagina = model(0);

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamanoPagina())));
  paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas() - 1));
  desde = computed(() => (this.total() === 0 ? 0 : this.paginaActual() * this.tamanoPagina() + 1));
  hasta = computed(() => Math.min(this.total(), (this.paginaActual() + 1) * this.tamanoPagina()));

  ir(p: number) {
    const max = this.totalPaginas() - 1;
    this.pagina.set(Math.min(Math.max(0, p), max));
  }
}
