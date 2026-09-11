import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { DonacionService } from '../../../../services/donacion.service';
import { ImagenService } from '../../../../services/imagen.service';
import { AlmacenService } from '../../../../services/almacen.service';
import { TrabajadorService } from '../../../../services/trabajador.service';
import { SessionService } from '../../../../services/session.service';
import { Donacion } from '../../../../models/donacion.model';

interface FilaCorroboracion {
  idDetalle: number;
  categoria: string;
  descripcion: string;
  prometido: number;
  recibido: number | null;
  fechaVencimiento: string | null;
}

type Incidencia = 'EXCEDENTE' | 'FALTANTE';

@Component({
  selector: 'app-corroboracion-page',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './corroboracion-page.html',
})
export class CorroboracionPageComponent implements OnInit {
  private donacionService = inject(DonacionService);
  private imagenService = inject(ImagenService);
  private almacenService = inject(AlmacenService);
  private trabajadorService = inject(TrabajadorService);
  private session = inject(SessionService);

  pendientes = signal<Donacion[]>([]);
  codigoInput = signal('');
  seleccion = signal<Donacion | null>(null);
  filas = signal<FilaCorroboracion[]>([]);

  cargandoPendientes = signal(true);
  codigoError = signal('');
  enviando = signal(false);
  exito = signal('');
  error = signal('');

  evidencias = signal<File[]>([]);
  previews = signal<string[]>([]);
  evidenciaError = signal('');

  modalAbierto = signal(false);

  lat = signal<number | null>(null);
  lon = signal<number | null>(null);
  gpsNavegando = signal(false);
  gpsError = signal('');

  usuario = this.session.getUser();

  formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  maxTamanoBytes = 10 * 1024 * 1024;
  maxEvidencias = 3;

  totalItems = computed(() =>
    this.filas().reduce((acc, f) => acc + (f.prometido ?? 0), 0),
  );

  conIncidencias = computed(
    () => this.filas().filter((f) => f.recibido != null && f.recibido !== f.prometido).length,
  );

  incidenciaOf(fila: FilaCorroboracion): Incidencia | null {
    if (fila.recibido == null) return null;
    if (fila.recibido === fila.prometido) return null;
    return fila.recibido > fila.prometido ? 'EXCEDENTE' : 'FALTANTE';
  }

  puedeValidar = computed(
    () =>
      this.filas().length > 0 &&
      this.filas().every(
        (f) => f.recibido != null && Number.isFinite(f.recibido) && f.recibido >= 0,
      ),
  );

  huecosEvidencia = computed(() => this.maxEvidencias - this.evidencias().length);

  ngOnInit() {
    this.cargarPendientes();
  }

  cargarPendientes() {
    this.cargandoPendientes.set(true);
    this.codigoError.set('');
    this.donacionService.listar().subscribe({
      next: (data) => {
        this.pendientes.set(this.filtrarVerificables(data));
        this.cargandoPendientes.set(false);
      },
      error: () => {
        this.pendientes.set([]);
        this.cargandoPendientes.set(false);
        this.codigoError.set('No se pudieron cargar las donaciones.');
      },
    });
  }

  private filtrarVerificables(data: Donacion[]): Donacion[] {
    return data.filter(
      (d) => d.estadoActual !== 'ANULADO' && d.estadoActual !== 'RECHAZADA',
    );
  }

  onCodigoChange(event: Event) {
    this.codigoInput.set((event.target as HTMLInputElement).value.toUpperCase());
  }

  buscarPorCodigo() {
    const codigo = this.codigoInput().trim().toUpperCase();
    if (!codigo) {
      this.codigoError.set('Ingresa el código de seguimiento de la donación.');
      return;
    }
    this.cargandoPendientes.set(true);
    this.codigoError.set('');

    this.donacionService.listar().subscribe({
      next: (data) => {
        this.cargandoPendientes.set(false);
        const verificables = this.filtrarVerificables(data);
        this.pendientes.set(verificables);
        const match = verificables.find((d) => d.codigoSeguimiento.toUpperCase() === codigo);
        if (match) {
          this.cargarDonacion(match);
        } else {
          this.error.set('No se encontró una donación corroborable con ese código.');
        }
      },
      error: () => {
        this.cargandoPendientes.set(false);
        this.codigoError.set('No se pudo completar la búsqueda. Intenta nuevamente.');
        if (this.pendientes().length === 0) this.cargarPendientes();
      },
    });
  }

  seleccionarPendiente(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    const d = this.pendientes().find((x) => x.idDonacion === id);
    if (d) this.cargarDonacion(d);
  }

  cargarDonacion(d: Donacion) {
    this.limpiar();
    this.seleccion.set(d);
    this.filas.set(
      d.detalles.map((det) => ({
        idDetalle: det.idDetalle,
        categoria: det.nombreCategoria,
        descripcion: det.descripcionDetalle,
        prometido: det.cantidadDeclarada,
        recibido: null,
        fechaVencimiento: det.fechaVencimiento,
      })),
    );
  }

  onRecibidoChange(fila: FilaCorroboracion, event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const valor = raw === '' ? null : Number(raw);
    const limpio = valor != null && Number.isFinite(valor) && valor >= 0 ? valor : null;
    this.filas.update((rows) =>
      rows.map((r) => (r.idDetalle === fila.idDetalle ? { ...r, recibido: limpio } : r)),
    );
    this.error.set('');
  }

  onSeleccionarEvidencias(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    const invalidos = files.filter(
      (f) => !this.formatosPermitidos.includes(f.type) || f.size > this.maxTamanoBytes,
    );
    if (invalidos.length > 0) {
      this.evidenciaError.set('Formato no permitido. Solo JPG, PNG o WebP (máx. 10 MB).');
      return;
    }
    const disponibles = this.huecosEvidencia();
    if (files.length > disponibles) {
      this.evidenciaError.set(`Solo puedes adjuntar hasta ${this.maxEvidencias} fotos de evidencia.`);
      return;
    }
    this.evidenciaError.set('');
    const nuevasPreviews = files.map((f) => URL.createObjectURL(f));
    this.evidencias.update((prev) => [...prev, ...files]);
    this.previews.set([...this.previews(), ...nuevasPreviews]);
  }

  quitarEvidencia(index: number) {
    const remover = this.previews()[index];
    if (remover) URL.revokeObjectURL(remover);
    this.evidencias.update((prev) => prev.filter((_, i) => i !== index));
    this.previews.update((prev) => prev.filter((_, i) => i !== index));
    this.evidenciaError.set('');
  }

  obtenerGPS() {
    if (this.lat() != null && this.lon() != null) return;
    if (!navigator.geolocation) {
      this.gpsError.set('Tu navegador no soporta geolocalización.');
      return;
    }
    this.gpsNavegando.set(true);
    this.gpsError.set('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.lat.set(pos.coords.latitude);
        this.lon.set(pos.coords.longitude);
        this.gpsNavegando.set(false);
      },
      (err) => {
        this.gpsNavegando.set(false);
        this.gpsError.set('No se pudo obtener el GPS (' + (err.message || 'permiso denegado') + ').');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  confirmar() {
    const d = this.seleccion();
    if (!d || !this.puedeValidar()) return;
    this.obtenerGPS();
    if (this.conIncidencias() > 0) {
      this.modalAbierto.set(true);
    } else {
      this.enviar();
    }
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  confirmarConIncidencias() {
    this.modalAbierto.set(false);
    this.enviar();
  }

  private enviar() {
    const d = this.seleccion();
    if (!d || !this.puedeValidar()) return;
    this.enviando.set(true);
    this.error.set('');

    this.trabajadorService.obtenerTrabajadorPorUsuario(this.usuario?.idUsuario ?? 0).subscribe({
      next: (trabajador) => {
        if (!trabajador) {
          this.enviando.set(false);
          this.error.set(
            'No se encontró un perfil de trabajador asociado a tu cuenta. Verifica que estés registrado como Personal de Apoyo.',
          );
          return;
        }
        this.corroborarYEnviar(d, trabajador.idTrabajador);
      },
      error: () => {
        this.enviando.set(false);
        this.error.set('No se pudo verificar tu perfil de trabajador. Intenta nuevamente.');
      },
    });
  }

  private corroborarYEnviar(d: Donacion, idTrabajador: number) {
    const detalles = this.filas().map((f) => ({
      idDetalle: f.idDetalle,
      cantidadVerificada: f.recibido!,
    }));

    this.almacenService
      .corroborarRecepcion({
        idDonacion: d.idDonacion,
        idLocal: d.idLocalRecepcion,
        idTrabajador,
        latitud: this.lat() ?? undefined,
        longitud: this.lon() ?? undefined,
        detalles,
      })
      .subscribe({
        next: () => {
          this.subirEvidencias(d);
        },
        error: (err) => {
          this.enviando.set(false);
          this.error.set(err.error?.message || 'Error al confirmar la recepción. Intenta nuevamente.');
        },
      });
  }

  private subirEvidencias(d: Donacion) {
    const files = this.evidencias();
    if (files.length === 0) {
      this.finalizar(d);
      return;
    }
    this.imagenService
      .subirEvidencias(d.idDonacion, files)
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: () => this.finalizar(d, ' '),
        error: () => this.finalizar(d),
      });
  }

  private finalizar(d: Donacion, extra = '') {
    this.enviando.set(false);
    this.exito.set(
      `Recepción corroborada correctamente para ${d.codigoSeguimiento}.${extra.trim() ? ' No se pudieron adjuntar las evidencias.' : ''}`,
    );
    this.pendientes.update((list) => list.filter((x) => x.idDonacion !== d.idDonacion));
    this.seleccion.set(null);
    this.filas.set([]);
    this.previews().forEach((p) => URL.revokeObjectURL(p));
    this.evidencias.set([]);
    this.previews.set([]);
    this.gpsError.set('');
  }

  private limpiar() {
    this.error.set('');
    this.exito.set('');
    this.codigoError.set('');
    this.previews().forEach((p) => URL.revokeObjectURL(p));
    this.evidencias.set([]);
    this.previews.set([]);
    this.evidenciaError.set('');
    this.gpsError.set('');
    this.lat.set(null);
    this.lon.set(null);
  }
}