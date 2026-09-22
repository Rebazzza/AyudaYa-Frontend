import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MonetariaService } from '../../services/monetaria.service';
import { ImagenService } from '../../services/imagen.service';
import { SessionService } from '../../services/session.service';
import { DonacionMonetariaRegistroRequest } from '../../models/monetaria.model';

@Component({
  selector: 'app-donacion-monetaria',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './donacion-monetaria.html',
})
export class DonacionMonetariaComponent {
  private monetariaService = inject(MonetariaService);
  private imagenService = inject(ImagenService);
  private session = inject(SessionService);

  user = this.session.getUser();

  form = {
    monto: 0 as number | null,
    metodoPago: 'YAPE' as string,
    numeroOperacion: '',
  };

  archivo = signal<File | null>(null);
  comprobanteUrl = signal('');
  subiendoCaptura = signal(false);
  previewUrl = signal('');

  guardando = signal(false);
  error = signal('');
  exito = signal('');

  metodosPago = ['YAPE', 'PLIN', 'TRANSFERENCIA'];

  onSeleccionarCaptura(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const esImagen = file.type.startsWith('image/');
    if (!esImagen) {
      this.error.set('La captura debe ser una imagen (JPG, PNG o WebP).');
      return;
    }

    this.archivo.set(file);
    this.error.set('');
    this.previewUrl.set(URL.createObjectURL(file));

    this.subirCaptura(file);
  }

  private subirCaptura(file: File) {
    const idUsuario = this.user?.idUsuario;
    if (idUsuario == null) {
      this.error.set('Sesión no válida. Vuelve a iniciar sesión.');
      return;
    }
    this.subiendoCaptura.set(true);
    this.imagenService.upload(file, 'COMPROBANTE', undefined, idUsuario).subscribe({
      next: (img) => {
        this.subiendoCaptura.set(false);
        this.comprobanteUrl.set(this.imagenService.storageUrl + img.rutaUrl);
      },
      error: () => {
        this.subiendoCaptura.set(false);
        this.comprobanteUrl.set('');
        this.error.set('No se pudo subir la captura del comprobante.');
      },
    });
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
      this.error.set('Ingresa un monto mayor a 0 (S/).');
      return;
    }
    const metodoPago = this.form.metodoPago.trim();
    const numeroOperacion = this.form.numeroOperacion.trim();
    if (!metodoPago || !numeroOperacion) {
      this.error.set('Completa el método de pago y el número de operación.');
      return;
    }

    const body: DonacionMonetariaRegistroRequest = {
      idUsuario,
      monto: this.form.monto,
      moneda: 'PEN',
      metodoPago,
      numeroOperacion,
      comprobanteUrl: this.comprobanteUrl() || undefined,
    };

    this.guardando.set(true);
    this.monetariaService.registrarMonetaria(body).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exito.set('Tu donación fue registrada. Se verificará el voucher (estado: PENDIENTE).');
        this.form = { monto: null, metodoPago: 'YAPE', numeroOperacion: '' };
        this.archivo.set(null);
        this.comprobanteUrl.set('');
        this.previewUrl.set('');
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'Error al registrar la donación monetaria.');
      },
    });
  }
}