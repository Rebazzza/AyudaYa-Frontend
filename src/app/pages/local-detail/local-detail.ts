import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocalService } from '../../services/local.service';
import { SessionService } from '../../services/session.service';
import { Local, CapacidadLocal } from '../../models/local.model';
import { DonacionService } from '../../services/donacion.service';
import { Donacion } from '../../models/donacion.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-local-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './local-detail.html',
})
export class LocalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private localService = inject(LocalService);
  private donacionService = inject(DonacionService);
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
  pendientesMedicion = signal<Donacion[]>([]);
  volumenes: Record<number, number | null> = {};
  midiendo = signal<number | null>(null);
  medicionError = signal('');

  mapsLink = computed(() => {
    const loc = this.local();
    if (loc?.latitud == null || loc.longitud == null) return '';
    return `https://www.google.com/maps/search/?api=1&query=${loc?.latitud},${loc?.longitud}`;
  });

  porcentajeOcupacion = computed(() => {
    const cap = this.capacidad();
    if (!cap || cap.capacidadLocalM3 == null || cap.capacidadLocalM3 <= 0 || cap.donacionesSinVolumen > 0) return null;
    return Math.min(100, Math.round((cap.volumenOcupadoM3 / cap.capacidadLocalM3) * 100));
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
    if (this.esAdmin) this.cargarPendientesMedicion(id);
  }

  private cargarPendientesMedicion(idLocal: number) {
    this.donacionService.listar().subscribe({
      next: (donaciones) => this.pendientesMedicion.set(donaciones.filter(d =>
        d.idLocalRecepcion === idLocal && d.estadoActual === 'EN_ALMACEN' && d.volumenVerificadoM3 == null)),
      error: () => this.medicionError.set('No se pudieron cargar las donaciones pendientes de medición.'),
    });
  }

  registrarVolumen(donacion: Donacion) {
    const texto = String(this.volumenes[donacion.idDonacion] ?? '');
    if (!/^\d{1,9}(\.\d{1,3})?$/.test(texto) || Number(texto) < 0.001) {
      this.medicionError.set('Ingresa un volumen positivo en m³ con hasta tres decimales.');
      return;
    }
    this.medicionError.set('');
    this.midiendo.set(donacion.idDonacion);
    this.donacionService.registrarVolumenHistorico(donacion.idDonacion, Number(texto)).subscribe({
      next: () => {
        this.pendientesMedicion.update(lista => lista.filter(d => d.idDonacion !== donacion.idDonacion));
        this.midiendo.set(null);
        this.localService.capacidad(this.local()!.idLocal).subscribe({ next: capacidad => this.capacidad.set(capacidad) });
      },
      error: (err) => {
        this.midiendo.set(null);
        this.medicionError.set(err.error?.message || 'No se pudo guardar la medición.');
      },
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
