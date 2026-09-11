import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { DonacionService } from '../../services/donacion.service';
import { NotificacionService } from '../../services/notificacion.service';
import { LocalService } from '../../services/local.service';
import { CategoriaService } from '../../services/categoria.service';
import { TrabajadorService } from '../../services/trabajador.service';
import { Donacion } from '../../models/donacion.model';
import { Notificacion } from '../../models/notificacion.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private session = inject(SessionService);
  private donacionService = inject(DonacionService);
  private notificacionService = inject(NotificacionService);
  private localService = inject(LocalService);
  private categoriaService = inject(CategoriaService);
  private trabajadorService = inject(TrabajadorService);

  user = this.session.getUser();
  esDonante = this.user?.nombreRol === 'Donante';
  esAdmin = this.session.esAdmin();

  donaciones = signal<Donacion[]>([]);
  notificaciones = signal<Notificacion[]>([]);
  totalLocales = signal(0);
  totalCategorias = signal(0);
  totalTrabajadores = signal(0);

  loading = signal(true);

  estadosOrden = ['REGISTRADO', 'EN_TRANSITO', 'EN_ALMACEN', 'VERIFICADO', 'ENTREGADO', 'ANULADO'];

  private etiquetas: Record<string, string> = {
    REGISTRADO: 'Registrado',
    EN_TRANSITO: 'En tránsito',
    EN_ALMACEN: 'En almacén',
    VERIFICADO: 'Verificado',
    ENTREGADO: 'Entregado',
    ANULADO: 'Anulado',
    RECHAZADA: 'Rechazada',
  };

  nombreCompleto = `${this.user?.nombreUsuario ?? ''} ${this.user?.apellidosUsuario ?? ''}`.trim();
  iniciales = ((this.user?.nombreUsuario?.[0] ?? '') + (this.user?.apellidosUsuario?.[0] ?? '')).toUpperCase();

  saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  totalDonaciones = computed(() => this.donaciones().length);

  donacionesPorEstado = computed(() => {
    const counts = new Map<string, number>();
    for (const d of this.donaciones()) {
      counts.set(d.estadoActual, (counts.get(d.estadoActual) ?? 0) + 1);
    }
    return counts;
  });

  notificacionesNoLeidas = computed(
    () => this.notificaciones().filter((n) => !n.leido).length,
  );

  donacionesRecientes = computed(() => this.donaciones().slice(0, 5));

  notificacionesRecientes = computed(() => this.notificaciones().slice(0, 5));

  totalCantidadDeclarada = computed(() =>
    this.donaciones().reduce(
      (acc, d) => acc + d.detalles.reduce((s, det) => s + det.cantidadDeclarada, 0),
      0,
    ),
  );

  etiquetaEstado(estado: string): string {
    return this.etiquetas[estado] ?? estado;
  }

  conteoEstado(estado: string): number {
    return this.donacionesPorEstado().get(estado) ?? 0;
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'REGISTRADO':
        return 'bg-secondary-fixed text-on-secondary-fixed';
      case 'EN_TRANSITO':
        return 'bg-primary-fixed text-on-primary-fixed';
      case 'EN_ALMACEN':
        return 'bg-primary-fixed text-on-primary-fixed';
      case 'VERIFICADO':
        return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'ENTREGADO':
        return 'bg-surface-container-high text-on-surface';
      case 'ANULADO':
        return 'bg-error-container text-on-error-container';
      case 'RECHAZADA':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-high text-on-surface';
    }
  }

  ngOnInit() {
    const idUsuario = this.user!.idUsuario;

    this.donacionService.listar(this.esDonante ? idUsuario : undefined).subscribe({
      next: (data) => {
        this.donaciones.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.notificacionService.listarPorUsuario(idUsuario).subscribe({
      next: (data) => this.notificaciones.set(data),
    });

    this.localService.listar().subscribe((data) => this.totalLocales.set(data.length));
    this.categoriaService.listar().subscribe((data) => this.totalCategorias.set(data.length));
    this.trabajadorService.listar().subscribe((data) => this.totalTrabajadores.set(data.length));
  }
}