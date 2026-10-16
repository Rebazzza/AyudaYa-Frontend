import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MonetariaService } from '../../services/monetaria.service';
import { SessionService } from '../../services/session.service';
import {
  DonacionMonetaria,
  ESTADOS_VERIFICACION,
  EstadoVerificacion,
  ETIQUETA_METODO,
  METODOS_PAGO,
  MONEDAS,
  PanelFondos,
  formatearMonto,
} from '../../models/monetaria.model';

const LIMITE_OBSERVACION = 500;

@Component({
  selector: 'app-verificar-fondos',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './verificar-fondos.html',
})
export class VerificarFondosComponent implements OnInit {
  private monetariaService = inject(MonetariaService);
  private session = inject(SessionService);

  user = this.session.getUser();

  // ── RF43 · filtros del listado ───────────────────────────────────────────
  estados = ESTADOS_VERIFICACION;
  metodosPago = METODOS_PAGO;
  monedas = MONEDAS;
  etiquetaMetodo = ETIQUETA_METODO;
  formatearMonto = formatearMonto;

  filtroEstado = '';
  filtroMetodo = '';
  filtroMoneda = '';
  busqueda = '';

  readonly tamanio = 20;
  pagina = signal(0);

  lista = signal<DonacionMonetaria[]>([]);
  totalElementos = signal(0);
  totalPaginas = signal(0);

  loading = signal(true);
  error = signal('');

  // ── RF44 · resumen de recaudación en vivo ────────────────────────────────
  panel = signal<PanelFondos | null>(null);

  // ── Modal de verificación ────────────────────────────────────────────────
  aporteEnAccion = signal<DonacionMonetaria | null>(null);
  estadoObjetivo: EstadoVerificacion = 'VERIFICADO';
  motivo = '';
  accionGuardando = signal(false);
  accionError = signal('');

  // ── Visor del voucher ────────────────────────────────────────────────────
  voucherVisible = signal<DonacionMonetaria | null>(null);

  hayFiltros = computed(
    () => !!(this.filtroEstado || this.filtroMetodo || this.filtroMoneda || this.busqueda.trim()),
  );

  ngOnInit() {
    this.cargar();
    this.cargarPanel();
  }

  get totalRecaudadoTexto(): string {
    const p = this.panel();
    if (!p) return '—';
    const pen = (p.totalRecaudadoPEN ?? 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const usd = (p.totalRecaudadoUSD ?? 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `S/ ${pen} · US$ ${usd}`;
  }

  cargar() {
    this.loading.set(true);
    this.error.set('');

    this.monetariaService
      .listar({
        estadoVerificacion: this.filtroEstado || undefined,
        metodoPago: this.filtroMetodo || undefined,
        moneda: this.filtroMoneda || undefined,
        busqueda: this.busqueda.trim() || undefined,
        pagina: this.pagina(),
        tamanio: this.tamanio,
      })
      .subscribe({
        next: (pagina) => {
          this.lista.set(pagina.contenido ?? []);
          this.totalElementos.set(pagina.totalElementos ?? 0);
          this.totalPaginas.set(pagina.totalPaginas ?? 0);
          if (this.pagina() >= (pagina.totalPaginas ?? 0) && this.pagina() > 0) {
            this.pagina.set(Math.max(0, (pagina.totalPaginas ?? 1) - 1));
            this.cargar();
            return;
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.lista.set([]);
          this.loading.set(false);
          this.error.set(err?.error?.message ?? err?.message ?? 'No se pudieron cargar las donaciones monetarias.');
        },
      });
  }

  cargarPanel() {
    this.monetariaService.getPanel().subscribe({
      next: (p) => this.panel.set(p),
      error: () => {},
    });
  }

  buscar() {
    this.pagina.set(0);
    this.cargar();
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroMetodo = '';
    this.filtroMoneda = '';
    this.busqueda = '';
    this.buscar();
  }

  cambiarPagina(delta: number) {
    const siguiente = this.pagina() + delta;
    if (siguiente < 0 || siguiente >= Math.max(1, this.totalPaginas())) return;
    this.pagina.set(siguiente);
    this.cargar();
  }

  // ── RF43 · actualizar estado de verificación ─────────────────────────────

  abrirAccion(aporte: DonacionMonetaria, estado: EstadoVerificacion) {
    this.aporteEnAccion.set(aporte);
    this.estadoObjetivo = estado;
    this.motivo = '';
    this.accionError.set('');
  }

  cancelarAccion() {
    if (this.accionGuardando()) return;
    this.aporteEnAccion.set(null);
    this.motivo = '';
    this.accionError.set('');
  }

  get tituloAccion(): string {
    switch (this.estadoObjetivo) {
      case 'VERIFICADO':
        return 'Verificar aporte';
      case 'RECHAZADO':
        return 'Rechazar aporte';
      default:
        return 'Devolver a pendiente';
    }
  }

  get requiereMotivo(): boolean {
    return this.estadoObjetivo === 'RECHAZADO';
  }

  confirmarAccion() {
    const aporte = this.aporteEnAccion();
    if (!aporte) return;

    const observacion = this.motivo.trim();
    if (this.requiereMotivo && !observacion) {
      this.accionError.set('Indica el motivo del rechazo (obligatorio, máx. 500 caracteres).');
      return;
    }
    if (observacion.length > LIMITE_OBSERVACION) {
      this.accionError.set(`La observación no puede superar los ${LIMITE_OBSERVACION} caracteres.`);
      return;
    }

    this.accionGuardando.set(true);
    this.accionError.set('');

    this.monetariaService
      .verificar(aporte.idDonacionMonetaria, {
        estado: this.estadoObjetivo,
        observacionVerificacion: observacion || undefined,
        // El backend no usa JWT: siempre hay quién envía quién verifica.
        idVerificador: this.user?.idUsuario,
      })
      .subscribe({
        next: (actualizado) => {
          this.lista.update((items) =>
            items.map((x) => (x.idDonacionMonetaria === actualizado.idDonacionMonetaria ? actualizado : x)),
          );
          this.accionGuardando.set(false);
          this.aporteEnAccion.set(null);
          this.motivo = '';
          this.cargarPanel();
        },
        error: (err) => {
          this.accionGuardando.set(false);
          this.accionError.set(
            err?.error?.message ?? err?.message ?? 'No se pudo actualizar el estado de verificación.',
          );
        },
      });
  }

  verVoucher(aporte: DonacionMonetaria) {
    this.voucherVisible.set(aporte);
  }

  urlVoucher(aporte: DonacionMonetaria): string {
    return this.monetariaService.urlComprobante(aporte.comprobanteUrl);
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-tertiary-container/25 text-tertiary';
      case 'VERIFICADO':
        return 'bg-primary-fixed text-on-primary-fixed';
      case 'RECHAZADO':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-high text-on-surface';
    }
  }
}
