import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MonetariaService } from '../../services/monetaria.service';
import { SessionService } from '../../services/session.service';
import {
  DonacionMonetaria,
  ETIQUETA_METODO,
  METODOS_PAGO,
  MONEDAS,
  MetodoPago,
  Moneda,
  formatearMonto,
} from '../../models/monetaria.model';

const LIMITE_5MB = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-donacion-monetaria',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './donacion-monetaria.html',
})
export class DonacionMonetariaComponent implements OnDestroy {
  private monetariaService = inject(MonetariaService);
  private session = inject(SessionService);

  user = this.session.getUser();

  form = {
    monto: null as number | null,
    moneda: 'PEN' as Moneda,
    metodoPago: 'YAPE' as MetodoPago,
    numeroOperacion: '',
  };

  archivo = signal<File | null>(null);
  previewUrl = signal('');
  arrastrando = signal(false);

  guardando = signal(false);
  error = signal('');
  exito = signal('');

  misAportes = signal<DonacionMonetaria[]>([]);
  cargandoAportes = signal(true);

  metodosPago = METODOS_PAGO;
  monedas = MONEDAS;
  etiquetaMetodo = ETIQUETA_METODO;
  formatearMonto = formatearMonto;

  ngOnInit() {
    this.cargarAportes();
  }

  ngOnDestroy() {
    const preview = this.previewUrl();
    if (preview) URL.revokeObjectURL(preview);
  }

  get simboloMonto(): string {
    return this.form.moneda === 'USD' ? 'US$' : 'S/';
  }

  rutaComprobante(aporte: DonacionMonetaria): string {
    return this.monetariaService.urlComprobante(aporte.comprobanteUrl);
  }

  cargarAportes() {
    const idUsuario = this.user?.idUsuario;
    if (idUsuario == null) {
      this.cargandoAportes.set(false);
      return;
    }
    this.cargandoAportes.set(true);
    this.monetariaService.listarPorUsuario(idUsuario).subscribe({
      next: (data) => {
        this.misAportes.set(data ?? []);
        this.cargandoAportes.set(false);
      },
      error: () => {
        this.misAportes.set([]);
        this.cargandoAportes.set(false);
      },
    });
  }

  /** RF42 · solo se aceptan caracteres A-Z a-z 0-9 - _ (sin espacios), máx. 50. */
  onNumeroOperacion(valor: string) {
    this.form.numeroOperacion = (valor ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 50);
  }

  onSeleccionarCaptura(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.validarCaptura(file);
  }

  onSoltarCaptura(event: DragEvent) {
    this.arrastrando.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.validarCaptura(file);
  }

  private validarCaptura(file: File) {
    this.error.set('');

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      this.error.set('La evidencia debe ser una imagen JPG, PNG o WebP.');
      return;
    }
    // El backend limita el comprobante a 5 MB (aunque el resto de la app permita 10 MB).
    if (file.size > LIMITE_5MB) {
      this.error.set('La imagen supera los 5 MB permitidos para el comprobante. Recorta o comprime la captura.');
      return;
    }

    const previewPrevio = this.previewUrl();
    if (previewPrevio) URL.revokeObjectURL(previewPrevio);

    this.archivo.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  quitarCaptura() {
    const previewPrevio = this.previewUrl();
    if (previewPrevio) URL.revokeObjectURL(previewPrevio);
    this.archivo.set(null);
    this.previewUrl.set('');
  }

  registrar() {
    this.error.set('');
    this.exito.set('');

    const idUsuario = this.user?.idUsuario;
    if (idUsuario == null) {
      this.error.set('Sesión no válida. Vuelve a iniciar sesión.');
      return;
    }
    if (!this.form.monto || this.form.monto <= 0) {
      this.error.set(`Ingresa un monto mayor a 0 (${this.simboloMonto}).`);
      return;
    }
    if (this.form.moneda !== 'PEN' && this.form.moneda !== 'USD') {
      this.error.set('Selecciona la moneda del aporte (PEN o USD).');
      return;
    }
    const metodoPago = this.form.metodoPago;
    if (!this.metodosPago.includes(metodoPago)) {
      this.error.set('Selecciona un método de pago válido (Yape, Plin o Transferencia).');
      return;
    }
    const numeroOperacion = this.form.numeroOperacion.trim();
    if (!numeroOperacion) {
      this.error.set('Ingresa el número de operación del comprobante.');
      return;
    }
    if (numeroOperacion.length > 50) {
      this.error.set('El número de operación no puede superar los 50 caracteres.');
      return;
    }
    const comprobante = this.archivo();
    if (!comprobante) {
      this.error.set('Adjunta la foto del voucher o comprobante de pago (JPG, PNG o WebP, máx. 5 MB).');
      return;
    }

    this.guardando.set(true);
    this.monetariaService
      .registrarConComprobante(
        {
          idUsuario,
          monto: this.form.monto,
          moneda: this.form.moneda,
          metodoPago,
          numeroOperacion,
        },
        comprobante,
      )
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.exito.set('Tu aporte fue registrado con su voucher. Queda en estado PENDIENTE hasta la verificación.');
          this.limpiarFormulario();
          this.cargarAportes();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(err?.error?.message ?? err?.message ?? 'Error al registrar la donación monetaria.');
        },
      });
  }

  private limpiarFormulario() {
    this.form = { monto: null, moneda: 'PEN', metodoPago: 'YAPE', numeroOperacion: '' };
    this.quitarCaptura();
    this.error.set('');
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-tertiary-container/25 text-tertiary';
      case 'VERIFICADO':
        return 'bg-primary-fixed text-on-primary-fixed';
      case 'RECHAZADO':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-high text-on-surface';
    }
  }
}
