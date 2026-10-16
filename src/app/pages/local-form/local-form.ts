import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LocalService } from '../../services/local.service';

@Component({
  selector: 'app-local-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './local-form.html',
})
export class LocalFormComponent implements OnInit {
  private localService = inject(LocalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Ruta `/locales/nuevo` = alta · `/locales/:id/editar` = edición (solo admin). */
  idLocal: number | null = null;
  modoEdicion = false;
  cargandoLocal = signal(false);
  private estadoOriginal = true;

  form = {
    nombreLocal: '',
    direccionLocal: '',
    latitud: 0,
    longitud: 0,
    capacidadLocalM3: 0,
    telefonoLocal: '',
    estadoActivo: true,
  };

  loading = signal(false);
  error = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idLocal = Number(id);
      this.modoEdicion = true;
      this.cargarLocal();
    }
  }

  get rutaVolver(): string {
    return this.modoEdicion && this.idLocal != null ? `/locales/${this.idLocal}` : '/locales';
  }

  cargarLocal() {
    if (this.idLocal == null) return;
    this.cargandoLocal.set(true);
    this.error.set('');
    this.localService.detalle(this.idLocal).subscribe({
      next: (local) => {
        this.form = {
          nombreLocal: local.nombreLocal,
          direccionLocal: local.direccionLocal,
          latitud: local.latitud,
          longitud: local.longitud,
          capacidadLocalM3: local.capacidadLocalM3 ?? 0,
          telefonoLocal: local.telefonoLocal,
          estadoActivo: local.estadoActivo !== false,
        };
        this.estadoOriginal = local.estadoActivo !== false;
        this.cargandoLocal.set(false);
      },
      error: (err) => {
        this.cargandoLocal.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el local');
      },
    });
  }

  /** Valida en cliente las mismas reglas que el backend (LocalRequest). */
  private validar(): string | null {
    const f = this.form;
    if (!f.nombreLocal.trim()) return 'El nombre del local es obligatorio.';
    if (f.nombreLocal.trim().length > 100) return 'El nombre del local no debe superar los 100 caracteres.';
    if (!f.direccionLocal.trim()) return 'La dirección del local es obligatoria.';
    if (f.direccionLocal.trim().length > 255) return 'La dirección no debe superar los 255 caracteres.';
    if (f.latitud == null || Number.isNaN(f.latitud) || f.latitud < -90 || f.latitud > 90) {
      return 'La latitud debe estar entre -90 y 90.';
    }
    if (f.longitud == null || Number.isNaN(f.longitud) || f.longitud < -180 || f.longitud > 180) {
      return 'La longitud debe estar entre -180 y 180.';
    }
    if (!f.capacidadLocalM3 || f.capacidadLocalM3 <= 0) return 'La capacidad en m³ debe ser mayor a 0.';
    if (!/^\d{9}$/.test((f.telefonoLocal ?? '').trim())) return 'El teléfono debe tener exactamente 9 dígitos.';
    return null;
  }

  onSubmit() {
    this.error.set('');
    const errorValidacion = this.validar();
    if (errorValidacion) {
      this.error.set(errorValidacion);
      return;
    }

    this.loading.set(true);
    const payload = {
      nombreLocal: this.form.nombreLocal.trim(),
      direccionLocal: this.form.direccionLocal.trim(),
      latitud: this.form.latitud,
      longitud: this.form.longitud,
      capacidadLocalM3: this.form.capacidadLocalM3,
      telefonoLocal: this.form.telefonoLocal.trim(),
    };

    if (this.modoEdicion && this.idLocal != null) {
      const id = this.idLocal;
      // Primero se guardan los datos y, solo si el administrador cambió el
      // interruptor, se envía aparte la activación/desactivación del local.
      const cambioEstado$ =
        this.form.estadoActivo !== this.estadoOriginal
          ? this.localService.cambiarEstado(id, this.form.estadoActivo)
          : of(null);

      this.localService
        .actualizar(id, payload)
        .pipe(switchMap(() => cambioEstado$))
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/locales', id]);
          },
          error: (err) => {
            this.loading.set(false);
            this.error.set(err.error?.message || 'Error al actualizar el local');
          },
        });
      return;
    }

    this.localService.registrar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/locales']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrar el local');
      },
    });
  }
}
