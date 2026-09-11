import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DonacionService } from '../../services/donacion.service';
import { SessionService } from '../../services/session.service';
import { ImagenService } from '../../services/imagen.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { TrabajadorService } from '../../services/trabajador.service';
import { DocumentoService, descargarBlob } from '../../services/documento.service';
import { Donacion, TrackingResponse } from '../../models/donacion.model';
import { HistorialEstado } from '../../models/historial.model';
import { ImagenEvidencia } from '../../models/imagen.model';
import { UbicacionActual } from '../../models/ubicacion.model';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

interface Paso {
  estado: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-seguimiento-donacion',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, SafeUrlPipe],
  templateUrl: './seguimientoDonacion.html',
})
export class SeguimientoDonacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private donacionService = inject(DonacionService);
  private session = inject(SessionService);
  private imagenService = inject(ImagenService);
  private ubicacionService = inject(UbicacionService);
  private trabajadorService = inject(TrabajadorService);
  private documentoService = inject(DocumentoService);

  codigoInput = signal('');
  tracking = signal<TrackingResponse | null>(null);
  donacion = signal<Donacion | null>(null);
  historial = signal<HistorialEstado[]>([]);
  loading = signal(true);
  error = signal('');
  buscado = signal(false);
  cambiandoEstado = signal(false);
  estadoError = signal('');

  imagenes = signal<ImagenEvidencia[]>([]);
  seleccionadas = signal<File[]>([]);
  subiendo = signal(false);
  imagenError = signal('');
  vistaPrevia = signal<ImagenEvidencia | null>(null);
  codigoCopiado = signal(false);

  ubicacion = signal<UbicacionActual | null>(null);
  escaneando = signal(false);
  scanError = signal('');
  estadoEscaneo = '';
  observacionEscaneo = '';
  idTrabajadorActual = signal<number | null>(null);

  generandoComprobante = signal(false);
  comprobanteError = signal('');
  correoAviso = signal('');

  mapUrl = computed(() => {
    const u = this.ubicacion();
    return u?.latitudGPS != null && u.longitudGPS != null
      ? `https://maps.google.com/maps?q=${u.latitudGPS},${u.longitudGPS}&z=16&output=embed`
      : '';
  });

  mapsLink = computed(() => {
    const u = this.ubicacion();
    return u?.latitudGPS != null && u.longitudGPS != null
      ? `https://www.google.com/maps/search/?api=1&query=${u.latitudGPS},${u.longitudGPS}`
      : '';
  });

  usuario = this.session.getUser();
  esAdmin = this.session.esAdmin();
  esTrabajador = this.usuario?.nombreRol === 'Personal de Apoyo' || this.esAdmin;
  nuevoEstado = '';
  observacion = '';

  transiciones: Record<string, string[]> = {
    REGISTRADO: ['EN_TRANSITO', 'EN_ALMACEN', 'ANULADO'],
    EN_TRANSITO: ['VERIFICADO'],
    EN_ALMACEN: ['VERIFICADO'],
    VERIFICADO: ['ENTREGADO'],
    ENTREGADO: [],
    ANULADO: [],
  };

  pasos: Paso[] = [
    { estado: 'REGISTRADO', etiqueta: 'Registrado', icono: 'assignment' },
    { estado: 'EN_TRANSITO', etiqueta: 'En tránsito', icono: 'local_shipping' },
    { estado: 'VERIFICADO', etiqueta: 'Verificado', icono: 'verified' },
    { estado: 'ENTREGADO', etiqueta: 'Entregado', icono: 'check' },
  ];

  etiquetas: Record<string, string> = {
    REGISTRADO: 'Registrado',
    EN_TRANSITO: 'En tránsito',
    EN_ALMACEN: 'En almacén',
    VERIFICADO: 'Verificado',
    ENTREGADO: 'Entregado',
    ANULADO: 'Anulado',
    RECHAZADA: 'Rechazada',
  };

  formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  maxTamanoBytes = 10 * 1024 * 1024;

  estadosSiguientes = computed(() => {
    const d = this.donacion();
    return d ? (this.transiciones[d.estadoActual] ?? []).filter((e) => e !== 'ANULADO') : [];
  });

  puedeAnular = computed(() => {
    const d = this.donacion();
    return d?.estadoActual === 'REGISTRADO' && d.idUsuario === this.usuario?.idUsuario;
  });

  estadoActual = computed(() =>
    this.tracking()?.estadoActual ?? this.donacion()?.estadoActual ?? '',
  );

  private indiceFase(estado: string): number {
    const objetivo = estado === 'EN_ALMACEN' ? 'EN_TRANSITO' : estado;
    return this.pasos.findIndex((p) => p.estado === objetivo);
  }

  pasoActual = computed(() => this.indiceFase(this.estadoActual()));

  esAnulada = computed(() => this.estadoActual() === 'ANULADO');

  puedeCargarEvidencias = computed(
    () => !!this.donacion() && this.esTrabajador && this.imagenes().length + this.seleccionadas().length < 3,
  );

  huecosLibres = computed(() => 3 - this.imagenes().length);

  historialOrdenado = computed(() => {
    const historial = this.tracking()?.historial ?? [];
    return [...historial].sort(
      (a, b) => new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime(),
    );
  });

  etiquetaEstado(estado: string): string {
    return this.etiquetas[estado] ?? estado;
  }

  urlImagen(img: ImagenEvidencia): string {
    return this.imagenService.storageUrl + img.rutaUrl;
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'REGISTRADO': return 'bg-secondary-fixed text-on-secondary-fixed';
      case 'EN_TRANSITO': return 'bg-primary-fixed text-on-primary-fixed';
      case 'EN_ALMACEN': return 'bg-primary-fixed text-on-primary-fixed';
      case 'VERIFICADO': return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'ENTREGADO': return 'bg-surface-container-high text-on-surface';
      case 'ANULADO': return 'bg-error-container text-on-error-container';
      case 'RECHAZADA': return 'bg-error-container text-on-error-container';
      default: return 'bg-surface-container-high text-on-surface';
    }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const codigo = this.route.snapshot.queryParamMap.get('codigo');

    if (this.usuario) {
      this.trabajadorService.obtenerTrabajadorPorUsuario(this.usuario.idUsuario).subscribe({
        next: (t) => this.idTrabajadorActual.set(t?.idTrabajador ?? null),
        error: () => {},
      });
    }

    if (id) {
      this.cargarPorId(Number(id));
    } else if (codigo) {
      this.codigoInput.set(codigo);
      this.buscar();
    } else {
      this.loading.set(false);
    }
  }

  cargarPorId(id: number) {
    this.loading.set(true);
    this.error.set('');
    this.donacionService.detalle(id).subscribe({
      next: (data) => {
        this.donacion.set(data);
        this.nuevoEstado = this.transiciones[data.estadoActual]?.[0] ?? data.estadoActual;
        this.estadoEscaneo = this.transiciones[data.estadoActual]?.[0] ?? data.estadoActual;
        this.donacionService.tracking(data.codigoSeguimiento).subscribe({
          next: (track) => {
            this.tracking.set(track);
            this.cargarUbicacion(track.codigoSeguimiento);
          },
          error: () => {},
        });
        this.cargarImagenes(id);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se encontró la donación');
      },
    });
    this.donacionService.historial(id).subscribe({
      next: (data) => this.historial.set(data),
    });
  }

  cargarUbicacion(codigo: string) {
    this.ubicacionService.tracking(codigo).subscribe({
      next: (data) => {
        this.ubicacion.set(data);
      },
      error: () => {},
    });
  }

  cargarImagenes(id: number) {
    this.imagenService.listarPorDonacion(id).subscribe({
      next: (data) => this.imagenes.set(data),
      error: () => {},
    });
  }

  abrirPreview(img: ImagenEvidencia) {
    this.vistaPrevia.set(img);
  }

  copiarCodigo() {
    const codigo = this.tracking()?.codigoSeguimiento ?? this.donacion()?.codigoSeguimiento ?? '';
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).then(() => {
      this.codigoCopiado.set(true);
      setTimeout(() => this.codigoCopiado.set(false), 2000);
    }, () => {});
  }

  descargarComprobante() {
    const codigo = this.tracking()?.codigoSeguimiento ?? this.donacion()?.codigoSeguimiento ?? '';
    if (!codigo || this.generandoComprobante()) return;
    this.generandoComprobante.set(true);
    this.comprobanteError.set('');
    this.documentoService.downloadComprobante(codigo).subscribe({
      next: (blob) => {
        descargarBlob(blob, `comprobante-${codigo}.pdf`);
        this.generandoComprobante.set(false);
      },
      error: (err) => {
        this.generandoComprobante.set(false);
        this.comprobanteError.set(err?.message ?? 'No se pudo generar el comprobante.');
      },
    });
  }

  private mostrarAvisoCorreo() {
    this.correoAviso.set('Hemos enviado una notificación al correo del donante.');
    setTimeout(() => this.correoAviso.set(''), 6000);
  }

  cerrarPreview() {
    this.vistaPrevia.set(null);
  }

  onSeleccionarArchivos(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.imagenError.set('');

    const noValidos = files.filter(
      (f) => !this.formatosPermitidos.includes(f.type) || f.size > this.maxTamanoBytes,
    );
    if (noValidos.length > 0) {
      this.imagenError.set('Formato no permitido. Solo se aceptan JPG, PNG o WebP (máx. 10 MB).');
      return;
    }
    if (this.imagenes().length + files.length > 3) {
      this.imagenError.set('No se pueden registrar más de 3 imágenes de evidencia por donación.');
      return;
    }
    this.seleccionadas.set(files);
  }

  quitarSeleccion(index: number) {
    this.seleccionadas.update((prev) => prev.filter((_, i) => i !== index));
  }

  subirEvidencias() {
    const d = this.donacion();
    if (!d || this.seleccionadas().length === 0) return;
    this.subiendo.set(true);
    this.imagenError.set('');
    this.imagenService.subirEvidencias(d.idDonacion, this.seleccionadas()).subscribe({
      next: (data) => {
        this.imagenes.update((prev) => [...prev, ...data]);
        this.seleccionadas.set([]);
        this.subiendo.set(false);
      },
      error: (err) => {
        this.subiendo.set(false);
        this.imagenError.set(err.error?.message || 'Error al subir las evidencias.');
      },
    });
  }

  eliminarImagen(img: ImagenEvidencia) {
    if (!img.idImagen) return;
    if (!confirm('¿Eliminar esta imagen de evidencia?')) return;
    this.imagenes.update((prev) => prev.filter((i) => i.idImagen !== img.idImagen));
    this.imagenError.set('');
    this.imagenService.eliminar(img.idImagen).subscribe({
      error: (err) => this.imagenError.set(err.error?.message || 'Error al eliminar la imagen.'),
    });
  }

  buscar() {
    const codigo = this.codigoInput().trim();
    if (!codigo) {
      this.error.set('Ingresa el código de seguimiento de tu donación.');
      this.tracking.set(null);
      this.buscado.set(true);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.buscado.set(true);
    this.donacionService.tracking(codigo).subscribe({
      next: (data) => {
        this.tracking.set(data);
        this.cargarUbicacion(data.codigoSeguimiento);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.tracking.set(null);
        this.error.set(err?.error?.message ?? 'No se encontró ninguna donación con ese código.');
      },
    });
  }

  escanear() {
    const d = this.donacion();
    if (!d) return;
    this.escaneando.set(true);
    this.scanError.set('');

    if (!navigator.geolocation) {
      this.escaneando.set(false);
      this.scanError.set('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.enviarEscaneo(d, pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        this.escaneando.set(false);
        this.scanError.set('No se pudo obtener el GPS: ' + (err.message || 'denegado por el usuario'));
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  private enviarEscaneo(d: Donacion, latitud: number, longitud: number) {
    this.ubicacionService.escaneo({
      codigoSeguimiento: d.codigoSeguimiento,
      idLocalRecepcion: d.idLocalRecepcion,
      idTrabajador: this.idTrabajadorActual() ?? undefined,
      nuevoEstado: this.estadoEscaneo,
      latitud,
      longitud,
      observacion: this.observacionEscaneo || undefined,
    }).subscribe({
      next: (data) => {
        this.escaneando.set(false);
        this.scanError.set('');
        this.observacionEscaneo = '';
        this.ubicacion.set(data);
        this.mostrarAvisoCorreo();
        const codigo = data.codigoSeguimiento;
        this.donacionService.tracking(codigo).subscribe((track) => this.tracking.set(track));
        this.donacionService.historial(d.idDonacion).subscribe((h) => this.historial.set(h));
        if (this.donacion()) {
          this.donacionService.detalle(d.idDonacion).subscribe((updated) => {
            this.donacion.set(updated);
            this.estadoEscaneo = this.transiciones[updated.estadoActual]?.[0] ?? updated.estadoActual;
            this.nuevoEstado = this.estadoEscaneo;
          });
        }
      },
      error: (err) => {
        this.escaneando.set(false);
        this.scanError.set(err.error?.message || 'Error al registrar el escaneo GPS.');
      },
    });
  }

  cambiarEstado() {
    const d = this.donacion();
    if (!d) return;
    this.cambiandoEstado.set(true);
    this.estadoError.set('');
    this.donacionService.cambiarEstado(d.idDonacion, {
      estado: this.nuevoEstado,
      observacionHistorial: this.observacion,
      idLocal: d.idLocalRecepcion,
      idTrabajador: this.idTrabajadorActual() ?? undefined,
    }).subscribe({
      next: (updated) => {
        this.cambiandoEstado.set(false);
        this.donacion.set(updated);
        this.nuevoEstado = this.transiciones[updated.estadoActual]?.[0] ?? updated.estadoActual;
        this.observacion = '';
        this.mostrarAvisoCorreo();
        this.donacionService.historial(d.idDonacion).subscribe((h) => this.historial.set(h));
        this.donacionService.tracking(updated.codigoSeguimiento).subscribe({
          next: (track) => this.tracking.set(track),
          error: () => {},
        });
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        this.estadoError.set(err.error?.message || 'Error al cambiar el estado');
      },
    });
  }

  anular() {
    const d = this.donacion();
    if (!d) return;
    if (!confirm('¿Anular esta donación? Esta acción no se puede deshacer.')) return;
    this.cambiandoEstado.set(true);
    this.estadoError.set('');
    this.donacionService.anular(d.idDonacion, d.idUsuario).subscribe({
      next: (updated) => {
        this.cambiandoEstado.set(false);
        this.donacion.set(updated);
        this.mostrarAvisoCorreo();
        this.donacionService.historial(d.idDonacion).subscribe((h) => this.historial.set(h));
        this.donacionService.tracking(updated.codigoSeguimiento).subscribe({
          next: (track) => this.tracking.set(track),
          error: () => {},
        });
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        this.estadoError.set(err.error?.message || 'Error al anular la donación');
      },
    });
  }
}