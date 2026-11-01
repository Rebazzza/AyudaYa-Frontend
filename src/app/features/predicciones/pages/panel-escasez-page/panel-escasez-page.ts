import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LocalService } from '../../../../services/local.service';
import { CategoriaService } from '../../../../services/categoria.service';
import { PrediccionService } from '../../../../services/prediccion.service';
import { Local } from '../../../../models/local.model';
import { Categoria } from '../../../../models/categoria.model';
import { NivelRiesgo, PrediccionEscasez } from '../../../../models/prediccion.model';

type ZonaSel = number | 'all';

@Component({
  selector: 'app-panel-escasez-page',
  standalone: true,
  templateUrl: './panel-escasez-page.html',
})
export class PanelEscasezPageComponent implements OnInit {
  private localService = inject(LocalService);
  private categoriaService = inject(CategoriaService);
  private prediccionService = inject(PrediccionService);

  readonly niveles: { valor: NivelRiesgo; texto: string }[] = [
    { valor: 'CRITICO', texto: 'Crítico' },
    { valor: 'ALTO', texto: 'Alto' },
    { valor: 'MEDIO', texto: 'Medio' },
    { valor: 'BAJO', texto: 'Bajo' },
  ];

  locales = signal<Local[]>([]);
  categorias = signal<Categoria[]>([]);
  zonaSel = signal<ZonaSel>('all');
  categoriaSel = signal<number | null>(null);

  predicciones = signal<PrediccionEscasez[]>([]);
  cargando = signal(true);
  error = signal('');

  criticas = computed(() => this.predicciones().filter((p) => p.nivelRiesgo === 'CRITICO'));

  conteoRiesgos = computed(() => {
    const conteo: Record<NivelRiesgo, number> = { CRITICO: 0, ALTO: 0, MEDIO: 0, BAJO: 0 };
    for (const prediccion of this.predicciones()) {
      conteo[prediccion.nivelRiesgo] = (conteo[prediccion.nivelRiesgo] ?? 0) + 1;
    }
    return conteo;
  });

  stockTotal = computed(() =>
    this.predicciones().reduce((acc, prediccion) => acc + (prediccion.stockActual ?? 0), 0),
  );

  ngOnInit() {
    this.categoriaService.listarActivas().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => this.categorias.set([]),
    });
    this.localService.listar().subscribe({
      next: (data) => this.locales.set(data),
      error: () => this.locales.set([]),
    });
    this.cargar();
  }

  onZona(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.zonaSel.set(valor === 'all' ? 'all' : Number(valor));
    this.cargar();
  }

  onCategoria(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.categoriaSel.set(valor === '' ? null : Number(valor));
    this.cargar();
  }

  recargar() {
    this.cargar();
  }

  private cargar() {
    this.cargando.set(true);
    this.error.set('');
    const zona = this.zonaSel();
    this.prediccionService
      .obtenerPredicciones({
        idZonaDesastre: typeof zona === 'number' ? zona : undefined,
        idCategoria: this.categoriaSel() ?? undefined,
      })
      .subscribe({
        next: (data) => {
          this.predicciones.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          this.predicciones.set([]);
          this.cargando.set(false);
          this.error.set(err.error?.message || 'No se pudieron calcular las predicciones de escasez.');
        },
      });
  }

  etiquetaRiesgo(nivel: NivelRiesgo): string {
    return this.niveles.find((n) => n.valor === nivel)?.texto ?? nivel;
  }

  claseBadge(nivel: NivelRiesgo): string {
    switch (nivel) {
      case 'CRITICO':
        return 'bg-error text-on-error';
      case 'ALTO':
        return 'bg-orange-500 text-white';
      case 'MEDIO':
        return 'bg-amber-400 text-amber-950';
      default:
        return 'bg-emerald-600 text-white';
    }
  }

  claseTarjeta(nivel: NivelRiesgo): string {
    switch (nivel) {
      case 'CRITICO':
        return 'border-error/60 bg-error-container/30';
      case 'ALTO':
        return 'border-orange-300 bg-orange-50';
      case 'MEDIO':
        return 'border-amber-300 bg-amber-50';
      default:
        return 'border-emerald-300 bg-emerald-50';
    }
  }

  claseIcono(nivel: NivelRiesgo): string {
    switch (nivel) {
      case 'CRITICO':
        return 'bg-error/15 text-error';
      case 'ALTO':
        return 'bg-orange-100 text-orange-700';
      case 'MEDIO':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-emerald-100 text-emerald-700';
    }
  }

  claseBarra(nivel: NivelRiesgo): string {
    switch (nivel) {
      case 'CRITICO':
        return 'bg-error';
      case 'ALTO':
        return 'bg-orange-500';
      case 'MEDIO':
        return 'bg-amber-400';
      default:
        return 'bg-emerald-500';
    }
  }

  iconoRiesgo(nivel: NivelRiesgo): string {
    switch (nivel) {
      case 'CRITICO':
        return 'local_fire_department';
      case 'ALTO':
        return 'warning';
      case 'MEDIO':
        return 'schedule';
      default:
        return 'check_circle';
    }
  }

  unidad(prediccion: PrediccionEscasez): string {
    return prediccion.unidadMedida || 'unid.';
  }

  diasTexto(prediccion: PrediccionEscasez): string {
    if (prediccion.diasAutonomia == null) {
      return 'Sin consumo registrado';
    }
    if (prediccion.diasAutonomia <= 0) {
      return 'Sin stock';
    }
    const dias = Math.round(prediccion.diasAutonomia);
    return dias === 1 ? '1 día de autonomía' : `${dias} días de autonomía`;
  }

  porcentajeBarra(prediccion: PrediccionEscasez): number {
    if (prediccion.diasAutonomia == null) {
      return 100;
    }
    return Math.max(4, Math.min(100, Math.round((prediccion.diasAutonomia / 15) * 100)));
  }
}