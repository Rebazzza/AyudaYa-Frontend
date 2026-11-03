import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LoteService } from '../../../../services/lote.service';
import { ImagenService } from '../../../../services/imagen.service';
import { EntregarLoteRequest, LoteDistribucion } from '../../../../models/lote.model';

@Component({
  selector: 'app-hoja-ruta-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './hoja-ruta-page.html',
})
export class HojaRutaPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private loteService = inject(LoteService);
  readonly imagenService = inject(ImagenService);

  @ViewChild('firmaCanvas') firmaCanvas?: ElementRef<HTMLCanvasElement>;

  lote = signal<LoteDistribucion | null>(null);
  cargando = signal(true);
  error = signal('');
  accionEnCurso = signal(false);

  representanteNombre = '';
  modoCodigo = signal(false);
  codigoConfirmacion = '';
  firmaCapturada = signal(false);
  private firmaCtx: CanvasRenderingContext2D | null = null;
  private dibujando = false;

  fotoUrl = signal<string | null>(null);
  fotoPreview = signal<string | null>(null);
  subiendoFoto = signal(false);
  fotoError = signal('');
  fotoProtegida = signal<string | null>(null);

  ngOnDestroy() {
    if (this.fotoProtegida()) URL.revokeObjectURL(this.fotoProtegida()!);
  }

  private cargarFotoProtegida(ruta?: string | null) {
    if (!ruta) return;
    this.imagenService.cargarArchivo(ruta).subscribe({
      next: (blob) => {
        if (this.fotoProtegida()) URL.revokeObjectURL(this.fotoProtegida()!);
        this.fotoProtegida.set(URL.createObjectURL(blob));
      },
      error: () => this.fotoError.set('No se pudo cargar la foto de entrega.'),
    });
  }

  latitud = signal<number | null>(null);
  longitud = signal<number | null>(null);
  gpsCargando = signal(false);
  gpsError = signal('');

  entregaError = signal('');

  toast = signal('');
  toastTipo = signal<'error' | 'exito'>('error');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.cargando.set(false);
      this.error.set('No se indicó un lote válido.');
      return;
    }
    this.cargar(id);
  }

  cargar(idLote: number) {
    this.cargando.set(true);
    this.error.set('');
    this.loteService
      .hojaRuta(idLote)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (lote) => {
          this.lote.set(lote);
          this.cargarFotoProtegida(lote.fotoEvidenciaUrl);
          this.representanteNombre = lote.representanteNombre ?? '';
          if (lote.latitudEntrega != null) this.latitud.set(lote.latitudEntrega);
          if (lote.longitudEntrega != null) this.longitud.set(lote.longitudEntrega);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? err?.message ?? 'No se pudo cargar la hoja de ruta.');
        },
      });
  }

  despachar() {
    const lote = this.lote();
    if (!lote || this.accionEnCurso()) return;
    const confirmado = window.confirm(
      `¿Despachar el lote ${lote.codigoLote}? Las donaciones y kits pasarán a EN_TRANSITO.`,
    );
    if (!confirmado) return;

    this.accionEnCurso.set(true);
    this.loteService
      .despachar(lote.idLote)
      .pipe(finalize(() => this.accionEnCurso.set(false)))
      .subscribe({
        next: (actualizado) => {
          this.lote.set(actualizado);
          this.cargarFotoProtegida(actualizado.fotoEvidenciaUrl);
          this.mostrarToast(`Lote ${actualizado.codigoLote} despachado.`, 'exito');
        },
        error: (err) => {
          this.mostrarToast(
            err?.error?.message ?? err?.message ?? 'No se pudo despachar el lote.',
            'error',
          );
        },
      });
  }

  seleccionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.fotoError.set('Selecciona un archivo de imagen.');
      return;
    }

    this.fotoError.set('');
    this.fotoUrl.set(null);
    const previewAnterior = this.fotoPreview();
    if (previewAnterior) URL.revokeObjectURL(previewAnterior);
    this.fotoPreview.set(URL.createObjectURL(file));
    this.subiendoFoto.set(true);

    this.imagenService
      .upload(file, 'EVIDENCIA_ENTREGA')
      .pipe(finalize(() => this.subiendoFoto.set(false)))
      .subscribe({
        next: (imagen) => this.fotoUrl.set(imagen.rutaUrl),
        error: (err) => {
          this.fotoError.set(
            err?.error?.message ?? err?.message ?? 'No se pudo subir la foto de evidencia.',
          );
          this.fotoUrl.set(null);
        },
      });
  }

  imprimirHoja() {
    window.print();
  }

  obtenerUbicacion() {
    if (!navigator.geolocation) {
      this.gpsError.set('Este dispositivo no permite obtener la ubicación GPS.');
      return;
    }
    this.gpsCargando.set(true);
    this.gpsError.set('');
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        this.latitud.set(posicion.coords.latitude);
        this.longitud.set(posicion.coords.longitude);
        this.gpsCargando.set(false);
      },
      () => {
        this.gpsCargando.set(false);
        this.gpsError.set(
          'No se pudo obtener la ubicación. Activa el GPS o ingresa las coordenadas manualmente.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  iniciarFirma(event: PointerEvent) {
    const canvas = event.target as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    this.firmaCtx = ctx;
    this.dibujando = true;
    this.firmaCapturada.set(true);

    const punto = this.posicionEnCanvas(canvas, event);
    ctx.beginPath();
    ctx.moveTo(punto.x, punto.y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#191c1d';
  }

  dibujarFirma(event: PointerEvent) {
    if (!this.dibujando || !this.firmaCtx) return;
    event.preventDefault();
    const canvas = event.target as HTMLCanvasElement;
    const punto = this.posicionEnCanvas(canvas, event);
    this.firmaCtx.lineTo(punto.x, punto.y);
    this.firmaCtx.stroke();
  }

  terminarFirma() {
    this.dibujando = false;
    this.firmaCtx = null;
  }

  limpiarFirma() {
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    this.firmaCapturada.set(false);
    this.firmaCtx = null;
    this.dibujando = false;
  }

  registrarEntrega() {
    const lote = this.lote();
    if (!lote || this.accionEnCurso()) return;
    this.entregaError.set('');

    const representanteNombre = this.representanteNombre.trim();
    if (!representanteNombre) {
      this.entregaError.set('Ingresa el nombre del representante que recibe la ayuda.');
      return;
    }

    let firma: string | null = null;
    let codigo: string | null = null;
    if (this.modoCodigo()) {
      codigo = this.codigoConfirmacion.trim();
      if (!codigo) {
        this.entregaError.set('Ingresa el código de confirmación.');
        return;
      }
    } else {
      firma = this.firmaComoDataUrl();
      if (!firma) {
        this.entregaError.set('Pide al representante que firme en el recuadro.');
        return;
      }
    }

    const fotoEvidenciaUrl = this.fotoUrl();
    if (!fotoEvidenciaUrl) {
      this.entregaError.set(
        this.subiendoFoto()
          ? 'Espera a que termine la subida de la foto de evidencia.'
          : 'Adjunta la foto de evidencia de la entrega.',
      );
      return;
    }

    const lat = this.latitud();
    const lon = this.longitud();
    if (lat == null || lon == null) {
      this.entregaError.set('Obtén las coordenadas GPS del punto de entrega.');
      return;
    }

    const body: EntregarLoteRequest = {
      representanteNombre,
      firmaDigitalBase64: firma,
      codigoConfirmacion: codigo,
      fotoEvidenciaUrl,
      latitudEntrega: lat,
      longitudEntrega: lon,
    };

    this.accionEnCurso.set(true);
    this.loteService
      .registrarEntrega(lote.idLote, body)
      .pipe(finalize(() => this.accionEnCurso.set(false)))
      .subscribe({
        next: (actualizado) => {
          this.lote.set(actualizado);
          this.mostrarToast('Entrega confirmada y registrada correctamente.', 'exito');
          this.cargarFotoProtegida(actualizado.fotoEvidenciaUrl);
        },
        error: (err) => {
          this.entregaError.set(
            err?.error?.message ?? err?.message ?? 'No se pudo registrar la entrega.',
          );
        },
      });
  }

  fotoAbsoluta(url?: string | null): string | null {
    return url ? this.fotoProtegida() : null;
  }

  firmaVisible(): string | null {
    const firma = this.lote()?.firmaDigitalBase64;
    if (!firma) return null;
    return firma.startsWith('data:') ? firma : `data:image/png;base64,${firma}`;
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'ARMADO':
        return 'Armado';
      case 'EN_TRANSITO':
        return 'En tránsito';
      case 'ENTREGADO':
        return 'Entregado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'ARMADO':
        return 'bg-secondary-container/30 text-on-secondary-container border-secondary/40';
      case 'EN_TRANSITO':
        return 'bg-tertiary-container/20 text-tertiary border-tertiary/40';
      case 'ENTREGADO':
        return 'bg-primary-fixed/50 text-on-primary-fixed border-primary/40';
      default:
        return 'bg-surface-container text-on-surface-variant border-outline-variant';
    }
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  mostrarToast(msg: string, tipo: 'error' | 'exito') {
    this.toast.set(msg);
    this.toastTipo.set(tipo);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 6000);
  }

  private firmaComoDataUrl(): string | null {
    const canvas = this.firmaCanvas?.nativeElement;
    if (!canvas || !this.firmaCapturada()) return null;
    return canvas.toDataURL('image/png');
  }

  private posicionEnCanvas(canvas: HTMLCanvasElement, event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * escalaX,
      y: (event.clientY - rect.top) * escalaY,
    };
  }
}
