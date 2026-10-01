import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { LocalService } from '../../../../services/local.service';
import { AlmacenService } from '../../../../services/almacen.service';
import { Local } from '../../../../models/local.model';
import { AlertaCaducidad, ResumenInventario } from '../../../../models/almacen.model';

type LocalSel = number | 'all' | null;

@Component({
  selector: 'app-inventario-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './inventario-page.html',
})
export class InventarioPageComponent implements OnInit {
  private localService = inject(LocalService);
  private almacenService = inject(AlmacenService);

  locales = signal<Local[]>([]);
  localSel = signal<LocalSel>(null);

  inventario = signal<ResumenInventario[]>([]);
  alertas = signal<AlertaCaducidad[]>([]);
  stockTotal = signal<number>(0);

  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.localService.listar().subscribe({
      next: (data) => {
        this.locales.set(data);
        if (data.length > 0) {
          this.localSel.set(data[0].idLocal);
          this.cargarDatos();
        } else {
          this.loading.set(false);
          this.error.set('No hay centros de acopio registrados.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los centros de acopio.');
      },
    });
  }

  seleccionarLocal(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.localSel.set(value === 'all' ? 'all' : Number(value));
    this.cargarDatos();
  }

  private cargarDatos() {
    const sel = this.localSel();
    if (sel == null) return;
    if (sel === 'all') {
      this.cargarTodos();
    } else {
      this.cargarUnLocal(sel);
    }
  }

  private cargarUnLocal(idLocal: number) {
    this.loading.set(true);
    this.error.set('');

    this.almacenService.obtenerInventario(idLocal).subscribe({
      next: (data) => {
        this.inventario.set(data);
        this.stockTotal.set(data.reduce((acc, i) => acc + (i.stockTotalVerificado ?? 0), 0));
      },
      error: (err) => {
        this.inventario.set([]);
        this.stockTotal.set(0);
        this.error.set(err.error?.message || 'No se pudo cargar el inventario.');
      },
    });

    this.almacenService.obtenerAlertasCaducidad(idLocal).subscribe({
      next: (data) => this.alertas.set(data),
      error: () => this.alertas.set([]),
    });

    this.loading.set(false);
  }

  private cargarTodos() {
    this.loading.set(true);
    this.error.set('');

    const locales = this.locales();
    if (locales.length === 0) {
      this.loading.set(false);
      this.error.set('No hay centros de acopio registrados.');
      return;
    }

    forkJoin([
      forkJoin(locales.map((l) => this.almacenService.obtenerInventario(l.idLocal))),
      forkJoin(locales.map((l) => this.almacenService.obtenerAlertasCaducidad(l.idLocal))),
    ]).subscribe({
      next: ([inventarios, alertas]) => {
        this.inventario.set(this.consolidarInventario(inventarios));
        this.alertas.set(alertas.flat());
        this.stockTotal.set(
          this.inventario().reduce((acc, i) => acc + (i.stockTotalVerificado ?? 0), 0),
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.inventario.set([]);
        this.alertas.set([]);
        this.stockTotal.set(0);
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el inventario consolidado.');
      },
    });
  }

  private consolidarInventario(listas: ResumenInventario[][]): ResumenInventario[] {
    const mapa = new Map<number, ResumenInventario>();
    for (const lista of listas) {
      for (const item of lista) {
        const actual = mapa.get(item.idCategoria);
        if (!actual) {
          mapa.set(item.idCategoria, { ...item });
          continue;
        }
        actual.stockTotalVerificado = (actual.stockTotalVerificado ?? 0) + (item.stockTotalVerificado ?? 0);
        actual.totalItemsIncidencia = (actual.totalItemsIncidencia ?? 0) + (item.totalItemsIncidencia ?? 0);
        actual.requiereRefrigeracion = actual.requiereRefrigeracion || item.requiereRefrigeracion;
        if (!actual.unidadMedida && item.unidadMedida) actual.unidadMedida = item.unidadMedida;
      }
    }
    return Array.from(mapa.values());
  }

  urgencia(alerta: AlertaCaducidad): 'critica' | 'proxima' {
    return alerta.diasRestantes <= 5 ? 'critica' : 'proxima';
  }

  diasTexto(alerta: AlertaCaducidad): string {
    if (alerta.diasRestantes <= 0) {
      return 'Vence hoy';
    }
    if (alerta.diasRestantes === 1) {
      return 'Vence mañana';
    }
    return `Vence en ${alerta.diasRestantes} días`;
  }
}