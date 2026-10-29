import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { DonacionService } from '../../services/donacion.service';
import { NotificacionService } from '../../services/notificacion.service';
import { LocalService } from '../../services/local.service';
import { CategoriaService } from '../../services/categoria.service';
import { TrabajadorService } from '../../services/trabajador.service';
import { MonetariaService } from '../../services/monetaria.service';
import { UsuarioService } from '../../services/usuario.service';
import { Donacion } from '../../models/donacion.model';
import { PanelFondos } from '../../models/monetaria.model';
import { Notificacion } from '../../models/notificacion.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private session = inject(SessionService);
  private router = inject(Router);
  private donacionService = inject(DonacionService);
  private notificacionService = inject(NotificacionService);
  private localService = inject(LocalService);
  private categoriaService = inject(CategoriaService);
  private trabajadorService = inject(TrabajadorService);
  private monetariaService = inject(MonetariaService);
  private usuarioService = inject(UsuarioService);

  user = this.session.getUser();
  esDonante = this.user?.nombreRol === 'Donante';
  esAdmin = this.session.esAdmin();
  esTrabajador = this.esAdmin || this.user?.nombreRol === 'Personal de Apoyo';

  /**
   * Utilidad de pruebas (TC-FUNC-01): el usuario de prueba Juan Perez ve un botón
   * para borrarse de la BD y volver al registro, evitando el 409 de duplicado.
   */
  esUsuarioPrueba = this.user?.nombreUsuario === 'Juan' && this.user?.apellidosUsuario === 'Perez';
  borrandoUsuario = signal(false);
  errorUsuario = signal('');

  donaciones = signal<Donacion[]>([]);
  notificaciones = signal<Notificacion[]>([]);
  totalLocales = signal(0);
  totalCategorias = signal(0);
  totalTrabajadores = signal(0);
  /** RF44 · consolidado de fondos recaudados (solo aportes verificados). */
  panelFondos = signal<PanelFondos | null>(null);

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

  /**
   * Borra la cuenta (y sus datos) del usuario de prueba Juan Perez y lo devuelve a la
   * vista de registro para poder repetir el TC-FUNC-01 sin duplicar correo/DNI.
   * Sin diálogo nativo para no bloquear la automatización de Katalon.
   */
  borrarUsuarioPrueba() {
    const usuario = this.user;
    if (!usuario || this.borrandoUsuario()) return;

    this.borrandoUsuario.set(true);
    this.errorUsuario.set('');

    this.usuarioService.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        this.borrandoUsuario.set(false);
        this.session.clearUser();
        this.router.navigate(['/registro']);
      },
      error: (err) => {
        this.borrandoUsuario.set(false);
        this.errorUsuario.set(err?.error?.message || 'No se pudo eliminar la cuenta de prueba');
      },
    });
  }

  ngOnInit() {
    const idUsuario = this.user!.idUsuario;

    // El skeleton se mantiene hasta que cargan los datos críticos. Para admin
    // incluye el panel de fondos, para que "Total recaudado" se pinte junto al
    // resto de paneles y no aparezca después con un salto de layout.
    let pendientes = this.esAdmin ? 2 : 1;
    const finalizarCarga = () => {
      pendientes -= 1;
      if (pendientes <= 0) this.loading.set(false);
    };

    this.donacionService.listar(this.esDonante ? idUsuario : undefined).subscribe({
      next: (data) => {
        this.donaciones.set(data);
        finalizarCarga();
      },
      error: () => finalizarCarga(),
    });

    this.notificacionService.listarPorUsuario(idUsuario).subscribe({
      next: (data) => this.notificaciones.set(data),
    });

    this.localService.listar().subscribe((data) => this.totalLocales.set(data.length));
    this.categoriaService.listar().subscribe((data) => this.totalCategorias.set(data.length));
    this.trabajadorService.listar().subscribe((data) => this.totalTrabajadores.set(data.length));

    if (this.esAdmin) {
      this.monetariaService.getPanel().subscribe({
        next: (p) => {
          this.panelFondos.set(p);
          finalizarCarga();
        },
        error: () => {
          this.panelFondos.set(null);
          finalizarCarga();
        },
      });
    }
  }
}