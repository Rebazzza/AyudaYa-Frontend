import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampanaService } from '../../services/campana.service';
import { CategoriaService } from '../../services/categoria.service';
import {
  AlertaStockCampana,
  Campana,
  CampanaRequest,
  MetaCampanaRequest,
} from '../../models/campana.model';
import { Categoria } from '../../models/categoria.model';

@Component({
  selector: 'app-campanas',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './campanas.html',
})
export class CampanasComponent implements OnInit {
  private campanaService = inject(CampanaService);
  private categoriaService = inject(CategoriaService);

  campanas = signal<Campana[]>([]);
  categorias = signal<Categoria[]>([]);
  alertas = signal<AlertaStockCampana[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  showForm = signal(false);
  editandoId = signal<number | null>(null);

  campanasActivas = computed(
    () => this.campanas().filter((c) => c.estadoVigencia === 'ACTIVA').length,
  );
  metasDefinidas = computed(
    () => this.campanas().reduce((total, c) => total + c.metas.length, 0),
  );
  alertasCriticas = computed(
    () => this.alertas().filter((a) => a.nivelAlerta === 'CRITICO').length,
  );

  form: CampanaRequest = this.formularioVacio();

  ngOnInit() {
    this.cargar();
    this.categoriaService.listarActivas().subscribe({
      next: (data) => this.categorias.set(data),
    });
  }

  cargar() {
    this.loading.set(true);
    this.error.set('');
    this.campanaService.listar().subscribe({
      next: (data) => {
        this.campanas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudieron cargar las campañas');
      },
    });
    this.campanaService.alertasStock().subscribe({
      next: (data) => this.alertas.set(data),
      error: () => this.alertas.set([]),
    });
  }

  abrirNueva() {
    this.editandoId.set(null);
    this.form = this.formularioVacio();
    this.error.set('');
    this.showForm.set(true);
  }

  abrirEdicion(campana: Campana) {
    this.editandoId.set(campana.idCampana);
    this.form = {
      nombreCampana: campana.nombreCampana,
      descripcion: campana.descripcion ?? '',
      zonaEmergencia: campana.zonaEmergencia,
      fechaInicio: campana.fechaInicio,
      fechaFin: campana.fechaFin,
      activa: campana.activa,
      metas: campana.metas.map((meta) => ({
        idCategoria: meta.idCategoria,
        cantidadObjetivo: meta.cantidadObjetivo,
        cantidadMinima: meta.cantidadMinima,
      })),
    };
    this.error.set('');
    this.showForm.set(true);
  }

  cancelar() {
    this.showForm.set(false);
    this.editandoId.set(null);
    this.error.set('');
  }

  agregarMeta() {
    this.form.metas = [...this.form.metas, this.metaVacia()];
  }

  quitarMeta(index: number) {
    this.form.metas = this.form.metas.filter((_, i) => i !== index);
    if (this.form.metas.length === 0) this.form.metas = [this.metaVacia()];
  }

  guardar() {
    this.error.set('');
    const problemas = this.validarFormulario();
    if (problemas) {
      this.error.set(problemas);
      return;
    }

    const request: CampanaRequest = {
      ...this.form,
      nombreCampana: this.form.nombreCampana.trim(),
      descripcion: this.form.descripcion?.trim() || null,
      zonaEmergencia: this.form.zonaEmergencia.trim(),
      metas: this.form.metas.map((meta) => ({
        idCategoria: Number(meta.idCategoria),
        cantidadObjetivo: Number(meta.cantidadObjetivo),
        cantidadMinima: Number(meta.cantidadMinima),
      })),
    };

    this.saving.set(true);
    const action = this.editandoId()
      ? this.campanaService.actualizar(this.editandoId()!, request)
      : this.campanaService.crear(request);

    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editandoId.set(null);
        this.cargar();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'No se pudo guardar la campaña');
      },
    });
  }

  desactivar(campana: Campana) {
    if (!confirm(`¿Desactivar la campaña "${campana.nombreCampana}"?`)) return;
    this.campanaService.desactivar(campana.idCampana).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err.error?.message || 'No se pudo desactivar la campaña'),
    });
  }

  activar(campana: Campana) {
    if (!confirm(`¿Reactivar la campaña "${campana.nombreCampana}"?`)) return;
    this.campanaService.activar(campana.idCampana).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err.error?.message || 'No se pudo activar la campaña'),
    });
  }

  unidadDe(idCategoria: number): string {
    return this.categorias().find((c) => c.idCategoria === Number(idCategoria))?.unidadMedCate ?? '';
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVA':
        return 'bg-primary-container/15 text-primary-container';
      case 'PROGRAMADA':
        return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'FINALIZADA':
        return 'bg-surface-container text-on-surface-variant';
      default:
        return 'bg-error-container text-on-error-container';
    }
  }

  claseAlerta(nivel: string): string {
    return nivel === 'CRITICO'
      ? 'bg-error-container text-on-error-container'
      : 'bg-tertiary-fixed text-on-tertiary-fixed';
  }

  private validarFormulario(): string | null {
    if (!this.form.nombreCampana.trim()) return 'El nombre de la campaña es obligatorio.';
    if (!this.form.zonaEmergencia.trim()) return 'La zona de emergencia es obligatoria.';
    if (!this.form.fechaInicio || !this.form.fechaFin) return 'Debes indicar el periodo de la campaña.';
    if (this.form.fechaFin < this.form.fechaInicio) {
      return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    }
    if (this.form.metas.length === 0) return 'Define al menos una meta por categoría.';

    const categorias = new Set<number>();
    for (const meta of this.form.metas) {
      if (!meta.idCategoria) return 'Selecciona la categoría de cada meta.';
      if (categorias.has(Number(meta.idCategoria))) {
        return 'No puedes repetir la misma categoría en dos metas.';
      }
      categorias.add(Number(meta.idCategoria));
      if (Number(meta.cantidadObjetivo) <= 0) {
        return 'La cantidad objetivo debe ser mayor a 0.';
      }
      if (Number(meta.cantidadMinima) < 0) {
        return 'La cantidad mínima no puede ser negativa.';
      }
      if (Number(meta.cantidadMinima) > Number(meta.cantidadObjetivo)) {
        return 'La cantidad mínima no puede superar la cantidad objetivo.';
      }
    }
    return null;
  }

  private formularioVacio(): CampanaRequest {
    const hoy = new Date();
    const fin = new Date();
    fin.setDate(fin.getDate() + 30);
    return {
      nombreCampana: '',
      descripcion: '',
      zonaEmergencia: '',
      fechaInicio: this.fechaIso(hoy),
      fechaFin: this.fechaIso(fin),
      activa: true,
      metas: [this.metaVacia()],
    };
  }

  private metaVacia(): MetaCampanaRequest {
    return { idCategoria: 0, cantidadObjetivo: 0, cantidadMinima: 0 };
  }

  private fechaIso(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
