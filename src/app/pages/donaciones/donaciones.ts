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
}