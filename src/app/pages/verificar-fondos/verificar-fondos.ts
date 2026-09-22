import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MonetariaService } from '../../services/monetaria.service';
import { DonacionMonetaria } from '../../models/monetaria.model';

@Component({
  selector: 'app-verificar-fondos',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './verificar-fondos.html',
})
export class VerificarFondosComponent implements OnInit {
  private monetariaService = inject(MonetariaService);

  monetarias = signal<DonacionMonetaria[]>([]);
  totalRecaudado = signal(0);
  loading = signal(true);
  error = signal('');

  procesandoId = signal<number | null>(null);
  procesandoAccion = signal('');
  procesarError = signal('');

  pendientes = computed(() => this.monetarias().filter((m) => m.estadoVerificacion === 'PENDIENTE'));

  totalText = computed(() => this.totalRecaudado().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set('');

    this.monetariaService.getTotalFondos().subscribe({
      next: (t) => this.totalRecaudado.set(t.totalRecaudadoPEN ?? 0),
      error: () => {},
    });

    this.monetariaService.listar().subscribe({
      next: (data) => {
        this.monetarias.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.monetarias.set([]);
        this.loading.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'No se pudieron cargar las donaciones monetarias.');
      },
    });
  }

  procesar(m: DonacionMonetaria, estado: 'VERIFICADO' | 'RECHAZADO') {
    this.procesandoId.set(m.idDonacionMonetaria);
    this.procesandoAccion.set(estado);
    this.procesarError.set('');

    this.monetariaService.verificarFondos(m.idDonacionMonetaria, estado).subscribe({
      next: () => {
        this.monetarias.update((lista) =>
          lista.map((x) => (x.idDonacionMonetaria === m.idDonacionMonetaria ? { ...x, estadoVerificacion: estado } : x)),
        );
        this.procesandoId.set(null);
        this.procesandoAccion.set('');
        this.monetariaService.getTotalFondos().subscribe({
          next: (t) => this.totalRecaudado.set(t.totalRecaudadoPEN ?? 0),
          error: () => {},
        });
      },
      error: (err) => {
        this.procesandoId.set(null);
        this.procesandoAccion.set('');
        this.procesarError.set(err?.error?.message ?? err?.message ?? 'No se pudo actualizar el estado de la donación.');
      },
    });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'VERIFICADO': return 'bg-primary-fixed text-on-primary-fixed';
      case 'RECHAZADO': return 'bg-error-container text-on-error-container';
      default: return 'bg-surface-container-high text-on-surface';
    }
  }
}