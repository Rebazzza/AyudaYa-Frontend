import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LocalService } from '../../../../services/local.service';
import { AlmacenService } from '../../../../services/almacen.service';
import { Local } from '../../../../models/local.model';
import { AlertaCaducidad, ResumenInventario } from '../../../../models/almacen.model';

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
  localSel = signal<number | null>(null);

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
    this.localSel.set(Number((event.target as HTMLSelectElement).value));
    this.cargarDatos();
  }

  private cargarDatos() {
    const idLocal = this.localSel();
    if (idLocal == null) return;
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