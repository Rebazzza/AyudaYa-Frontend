import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MonetariaService } from '../../services/monetaria.service';
import { ETIQUETA_MONEDA, PanelFondos } from '../../models/monetaria.model';

const INTERVALO_REFRESCO_MS = 30_000;

@Component({
  selector: 'app-panel-fondos',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './panel-fondos.html',
})
export class PanelFondosComponent implements OnInit, OnDestroy {
  private monetariaService = inject(MonetariaService);
  private timer: ReturnType<typeof setInterval> | null = null;

  panel = signal<PanelFondos | null>(null);
  loading = signal(true);
  actualizando = signal(false);
  error = signal('');
  ultimaActualizacion = signal<Date | null>(null);

  etiquetaMoneda = ETIQUETA_MONEDA;

  // El consolidado solo cuenta aportes VERIFICADOS y no aplica tipo de cambio.
  totalVerificado = computed(() => {
    const p = this.panel();
    return p ? (p.totalRecaudadoPEN ?? 0) + (p.totalRecaudadoUSD ?? 0) : 0;
  });

  maximoMoneda = computed(() =>
    Math.max(1, ...(this.panel()?.desglosePorMoneda ?? []).map((d) => d.monto ?? 0)),
  );

  maximoMetodo = computed(() =>
    Math.max(1, ...(this.panel()?.desglosePorMetodoPago ?? []).map((d) => d.monto ?? 0)),
  );

  maximoSerie = computed(() =>
    Math.max(1, ...(this.panel()?.serieMensual ?? []).map((s) => s.monto ?? 0)),
  );

  totalMetodosPEN = computed(() =>
    (this.panel()?.desglosePorMetodoPago ?? []).reduce((acc, d) => acc + (d.monto ?? 0), 0),
  );

  ngOnInit() {
    this.refrescar();
    // Actualización automática del consolidado (RF44: cálculo en tiempo real).
    this.timer = setInterval(() => this.refrescar(true), INTERVALO_REFRESCO_MS);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  refrescar(silencioso = false) {
    if (silencioso && this.actualizando()) return;
    this.actualizando.set(true);
    if (!silencioso) this.error.set('');

    this.monetariaService.getPanel().subscribe({
      next: (p) => {
        this.panel.set(p);
        this.ultimaActualizacion.set(new Date());
        this.loading.set(false);
        this.actualizando.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.actualizando.set(false);
        if (!silencioso) {
          this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo cargar el panel de recaudación.');
        }
      },
    });
  }

  porcentaje(monto: number, total: number): number {
    if (!total) return 0;
    return Math.round(((monto ?? 0) / total) * 1000) / 10;
  }

  alturaSerie(monto: number): number {
    return Math.max(3, ((monto ?? 0) / this.maximoSerie()) * 100);
  }

  anchoMetodo(monto: number): number {
    return Math.max(2, ((monto ?? 0) / this.maximoMetodo()) * 100);
  }

  anchoMoneda(monto: number): number {
    return Math.max(2, ((monto ?? 0) / this.maximoMoneda()) * 100);
  }
}
