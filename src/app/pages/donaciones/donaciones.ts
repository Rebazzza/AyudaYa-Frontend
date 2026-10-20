import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DonacionService } from '../../services/donacion.service';
import { SessionService } from '../../services/session.service';
import { Donacion } from '../../models/donacion.model';

@Component({
  selector: 'app-donaciones',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './donaciones.html',
})
export class DonacionesComponent implements OnInit {
  private donacionService = inject(DonacionService);
  private session = inject(SessionService);

  donaciones = signal<Donacion[]>([]);
  loading = signal(true);
  error = signal('');
  donacionAEliminar = signal<Donacion | null>(null);
  eliminando = signal(false);
  anulandoId = signal<number | null>(null);

  filtroEstado = '';
  busqueda = '';

  estadosPosibles = ['REGISTRADO', 'EN_TRANSITO', 'EN_ALMACEN', 'VERIFICADO', 'ENTREGADO', 'ANULADO', 'RECHAZADA'];

  etiquetasEstado: Record<string, string> = {
    REGISTRADO: 'Registrado',
    EN_TRANSITO: 'En tránsito',
    EN_ALMACEN: 'En almacén',
    VERIFICADO: 'Verificado',
    ENTREGADO: 'Entregado',
    ANULADO: 'Anulado',
    RECHAZADA: 'Rechazada',
  };

  etiquetaEstado(estado: string): string {
    return this.etiquetasEstado[estado] ?? estado;
  }

  filtradas = computed(() => {
    const termino = this.busqueda.trim().toLowerCase();
    return this.donaciones().filter((d) => {
      const coincideEstado = !this.filtroEstado || d.estadoActual === this.filtroEstado;
      const coincideTexto =
        !termino ||
        d.nombreDonante.toLowerCase().includes(termino) ||
        d.codigoSeguimiento.toLowerCase().includes(termino) ||
        d.nombreLocal.toLowerCase().includes(termino);
      return coincideEstado && coincideTexto;
    });
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set('');
    const user = this.session.getUser();
    const esDonante = user?.nombreRol === 'Donante';

    this.donacionService.listar(esDonante ? user?.idUsuario : undefined, this.filtroEstado || undefined)
      .subscribe({
        next: (data) => {
          this.donaciones.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Error al cargar donaciones');
        },
      });
  }

  aplicarFiltro() {
    this.cargar();
  }

  limpiarFiltro() {
    this.filtroEstado = '';
    this.busqueda = '';
    this.cargar();
  }

  eliminar(d: Donacion) {
    this.error.set('');
    this.donacionAEliminar.set(d);
  }

  puedeAnular(d: Donacion): boolean {
    return d.estadoActual === 'REGISTRADO';
  }

  anularDonacion(d: Donacion) {
    const user = this.session.getUser();
    if (!user || !this.puedeAnular(d) || this.anulandoId() !== null) return;

    this.anulandoId.set(d.idDonacion);
    this.error.set('');
    this.donacionService.anular(d.idDonacion, user.idUsuario).subscribe({
      next: (actualizada) => {
        this.anulandoId.set(null);
        this.donaciones.update((rows) =>
          rows.map((r) => (r.idDonacion === d.idDonacion ? { ...r, estadoActual: actualizada.estadoActual } : r)),
        );
      },
      error: (err) => {
        this.anulandoId.set(null);
        this.error.set(err.error?.message || 'Error al anular la donación');
      },
    });
  }

  cancelarEliminar() {
    if (this.eliminando()) return;
    this.donacionAEliminar.set(null);
  }

  confirmarEliminar() {
    const d = this.donacionAEliminar();
    if (!d || this.eliminando()) return;
    this.eliminando.set(true);
    this.error.set('');
    this.donacionService.eliminar(d.idDonacion).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.donacionAEliminar.set(null);
        this.donaciones.update((rows) => rows.filter((r) => r.idDonacion !== d.idDonacion));
      },
      error: (err) => {
        this.eliminando.set(false);
        this.error.set(err.error?.message || 'Error al eliminar la donación');
      },
    });
  }
}