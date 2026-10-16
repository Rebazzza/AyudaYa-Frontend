import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocalService } from '../../services/local.service';
import { SessionService } from '../../services/session.service';
import { Local, CapacidadLocal } from '../../models/local.model';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-local-detail',
  standalone: true,
  imports: [RouterLink, SafeUrlPipe],
  templateUrl: './local-detail.html',
})
export class LocalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private localService = inject(LocalService);
  private session = inject(SessionService);

  /** Editar la información y el estado de un local es exclusivo del administrador. */
  esAdmin = this.session.esAdmin();

  local = signal<Local | null>(null);
  capacidad = signal<CapacidadLocal | null>(null);
  loading = signal(true);
  error = signal('');

  cambiandoEstado = signal(false);
  accionError = signal('');
  aviso = signal('');

  mapUrl = computed(() => {
    const loc = this.local();
    return loc
      ? `https://maps.google.com/maps?q=${loc.latitud},${loc.longitud}&z=16&output=embed`
      : '';
  });

  mapsLink = computed(() => {
    const loc = this.local();
    return `https://www.google.com/maps/search/?api=1&query=${loc?.latitud},${loc?.longitud}`;
  });

  porcentajeOcupacion = computed(() => {
    const cap = this.capacidad();
    if (!cap || cap.capacidadLocalM3 == null || cap.capacidadLocalM3 <= 0) return null;
    return Math.min(100, Math.round((cap.donacionesEnAlmacen / cap.capacidadLocalM3) * 100));
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.localService.detalle(id).subscribe({
      next: (data) => {
        this.local.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se encontró el local');
      },
    });
    this.localService.capacidad(id).subscribe({
      next: (data) => this.capacidad.set(data),
      error: () => this.capacidad.set(null),
    });
  }

  /** RF: activar/desactivar el local (solo administrador). */
  cambiarEstado() {
    const loc = this.local();
    if (!loc || !this.esAdmin || this.cambiandoEstado()) return;

    const activar = loc.estadoActivo === false;
    const mensaje = activar
      ? `¿Reactivar "${loc.nombreLocal}"? Volverá a aparecer en el listado de locales para los donantes.`
      : `¿Desactivar "${loc.nombreLocal}"? Dejará de aparecer en el listado de locales para los donantes (sus donaciones y trabajadores no se eliminan).`;
    if (!confirm(mensaje)) return;

    this.cambiandoEstado.set(true);
    this.accionError.set('');
    this.aviso.set('');

    this.localService.cambiarEstado(loc.idLocal, activar).subscribe({
      next: (actualizado) => {
        this.local.set(actualizado);
        this.cambiandoEstado.set(false);
        this.aviso.set(activar ? 'Local activado correctamente.' : 'Local desactivado correctamente.');
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        this.accionError.set(err.error?.message || 'No se pudo cambiar el estado del local.');
      },
    });
  }
}
