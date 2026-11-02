import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { LoteService } from '../../../../services/lote.service';
import {
  CrearLoteRequest,
  DonacionLote,
  KitLote,
  LoteDistribucion,
} from '../../../../models/lote.model';

@Component({
  selector: 'app-lotes-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './lotes-page.html',
})
export class LotesPageComponent implements OnInit {
  private loteService = inject(LoteService);

  lotes = signal<LoteDistribucion[]>([]);
  donaciones = signal<DonacionLote[]>([]);
  kits = signal<KitLote[]>([]);
  cargando = signal(true);
  error = signal('');

  mostrarFormulario = signal(false);
  guardando = signal(false);
  formError = signal('');
  accionEnCurso = signal<number | null>(null);

  vehiculoPlaca = '';
  vehiculoModelo = '';
  conductorNombre = '';
  zonaDesastre = '';

  seleccionDonaciones = signal<Set<number>>(new Set());
  seleccionKits = signal<Set<number>>(new Set());

  totalSeleccion = computed(
    () => this.seleccionDonaciones().size + this.seleccionKits().size,
  );

  toast = signal('');
  toastTipo = signal<'error' | 'exito'>('error');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      lotes: this.loteService.listar(),
      donaciones: this.loteService.donacionesDisponibles(),
      kits: this.loteService.kitsDisponibles(),
    }).subscribe({
      next: ({ lotes, donaciones, kits }) => {
        this.lotes.set(lotes);
        this.donaciones.set(donaciones);
        this.kits.set(kits);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'No se pudieron cargar los lotes.');
      },
    });
  }

  abrirFormulario() {
    this.resetFormulario();
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
    this.formError.set('');
  }

  toggleDonacion(idDonacion: number) {
    this.seleccionDonaciones.update((actual) => {
      const copia = new Set(actual);
      if (copia.has(idDonacion)) copia.delete(idDonacion);
      else copia.add(idDonacion);
      return copia;
    });
  }

  toggleKit(idKit: number) {
    this.seleccionKits.update((actual) => {
      const copia = new Set(actual);
      if (copia.has(idKit)) copia.delete(idKit);
      else copia.add(idKit);
      return copia;
    });
  }

  estaDonacionSeleccionada(idDonacion: number): boolean {
    return this.seleccionDonaciones().has(idDonacion);
  }

  estaKitSeleccionado(idKit: number): boolean {
    return this.seleccionKits().has(idKit);
  }

  crear() {
    this.formError.set('');
    const vehiculoPlaca = this.vehiculoPlaca.trim();
    const conductorNombre = this.conductorNombre.trim();
    const zonaDesastre = this.zonaDesastre.trim();

    if (!vehiculoPlaca) {
      this.formError.set('Ingresa la placa o descripción del vehículo.');
      return;
    }
    if (!conductorNombre) {
      this.formError.set('Ingresa el nombre del conductor responsable.');
      return;
    }
    if (!zonaDesastre) {
      this.formError.set('Ingresa la zona de desastre o punto de entrega.');
      return;
    }
    if (this.totalSeleccion() === 0) {
      this.formError.set('Selecciona al menos una donación o un kit.');
      return;
    }

    const body: CrearLoteRequest = {
      idDonaciones: Array.from(this.seleccionDonaciones()),
      idKits: Array.from(this.seleccionKits()),
      vehiculoPlaca,
      vehiculoModelo: this.vehiculoModelo.trim() || null,
      conductorNombre,
      zonaDesastre,
    };

    this.guardando.set(true);
    this.loteService
      .crear(body)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (lote) => {
          this.mostrarFormulario.set(false);
          this.resetFormulario();
          this.mostrarToast(`Lote ${lote.codigoLote} armado correctamente.`, 'exito');
          this.cargarTodo();
        },
        error: (err) => {
          this.formError.set(
            err?.error?.message ?? err?.message ?? 'No se pudo armar el lote.',
          );
        },
      });
  }

  despachar(lote: LoteDistribucion) {
    if (this.accionEnCurso() != null) return;
    const confirmado = window.confirm(
      `¿Despachar el lote ${lote.codigoLote}? Las donaciones y kits pasarán a EN_TRANSITO.`,
    );
    if (!confirmado) return;

    this.accionEnCurso.set(lote.idLote);
    this.loteService
      .despachar(lote.idLote)
      .pipe(finalize(() => this.accionEnCurso.set(null)))
      .subscribe({
        next: (actualizado) => {
          this.lotes.update((lista) =>
            lista.map((item) => (item.idLote === actualizado.idLote ? actualizado : item)),
          );
          this.mostrarToast(`Lote ${actualizado.codigoLote} despachado.`, 'exito');
        },
        error: (err) => {
          this.mostrarToast(
            err?.error?.message ?? err?.message ?? 'No se pudo despachar el lote.',
            'error',
          );
        },
      });
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'ARMADO':
        return 'Armado';
      case 'EN_TRANSITO':
        return 'En tránsito';
      case 'ENTREGADO':
        return 'Entregado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'ARMADO':
        return 'bg-secondary-container/30 text-on-secondary-container border-secondary/40';
      case 'EN_TRANSITO':
        return 'bg-tertiary-container/20 text-tertiary border-tertiary/40';
      case 'ENTREGADO':
        return 'bg-primary-fixed/50 text-on-primary-fixed border-primary/40';
      default:
        return 'bg-surface-container text-on-surface-variant border-outline-variant';
    }
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  mostrarToast(msg: string, tipo: 'error' | 'exito') {
    this.toast.set(msg);
    this.toastTipo.set(tipo);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 6000);
  }

  private resetFormulario() {
    this.vehiculoPlaca = '';
    this.vehiculoModelo = '';
    this.conductorNombre = '';
    this.zonaDesastre = '';
    this.seleccionDonaciones.set(new Set());
    this.seleccionKits.set(new Set());
    this.formError.set('');
  }
}
