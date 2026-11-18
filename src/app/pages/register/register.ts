import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { IaService } from '../../services/ia.service';
import { IMAGE_ALLOWED_TYPES, MAX_IMAGE_SIZE_BYTES } from '../../shared/config/file-upload.config';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private iaService = inject(IaService);

  form = {
    dniUsuario: '',
    nombreUsuario: '',
    apellidosUsuario: '',
    correoUsuario: '',
    telefonoUsuario: '',
  };
  contrasena = '';
  contrasenaConfirm = '';

  loading = signal(false);
  error = signal('');
  /** TC-FUNC-01: alerta/toast de confirmación visible tras un registro exitoso. */
  exito = signal(false);
  cuentaCreada = signal<Usuario | null>(null);
  verificacionPendiente = signal(false);
  showPassword = signal(false);
  showPasswordConfirm = signal(false);

  dniFrontal = signal<File | null>(null);
  dniPosterior = signal<File | null>(null);
  dniFrontalPreview = signal<string | null>(null);
  dniPosteriorPreview = signal<string | null>(null);
  dniError = signal('');

  /** Estado de la evaluación de legibilidad de las dos caras del DNI. */
  validandoIdentidad = signal(false);
  identidadVerificada = signal(false);
  identidadResultado = signal('');
  identidadError = signal('');

  formatosPermitidos = IMAGE_ALLOWED_TYPES;
  maxTamanoBytes = MAX_IMAGE_SIZE_BYTES;

  get passwordsMatch(): boolean {
    return this.contrasena === this.contrasenaConfirm;
  }

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  toggleShowPasswordConfirm() {
    this.showPasswordConfirm.update((v) => !v);
  }

  onSeleccionarDni(event: Event, lado: 'frontal' | 'posterior') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;

    if (!this.formatosPermitidos.includes(file.type) || file.size > this.maxTamanoBytes) {
      this.dniError.set('Formato no permitido. Solo se aceptan JPG, PNG o WebP (máx. 10 MB).');
      return;
    }

    this.dniError.set('');
    // Al cambiar cualquier cara se invalida el dictamen previo: hay que revalidar.
    this.identidadVerificada.set(false);
    this.identidadResultado.set('');
    if (lado === 'frontal') {
      if (this.dniFrontalPreview()) URL.revokeObjectURL(this.dniFrontalPreview()!);
      this.dniFrontal.set(file);
      this.dniFrontalPreview.set(URL.createObjectURL(file));
    } else {
      if (this.dniPosteriorPreview()) URL.revokeObjectURL(this.dniPosteriorPreview()!);
      this.dniPosterior.set(file);
      this.dniPosteriorPreview.set(URL.createObjectURL(file));
    }
  }

  quitarDni(lado: 'frontal' | 'posterior') {
    if (lado === 'frontal') {
      if (this.dniFrontalPreview()) URL.revokeObjectURL(this.dniFrontalPreview()!);
      this.dniFrontal.set(null);
      this.dniFrontalPreview.set(null);
    } else {
      if (this.dniPosteriorPreview()) URL.revokeObjectURL(this.dniPosteriorPreview()!);
      this.dniPosterior.set(null);
      this.dniPosteriorPreview.set(null);
    }
    // Al quitar una cara vuelve a requerirse la validación completa.
    this.identidadVerificada.set(false);
    this.identidadResultado.set('');
  }

  /**
   * TC-FUNC-03 · RF03/RF16/RF17: envía anverso y reverso al microservicio Flask a través
   * del backend. El resultado se muestra con el campo `isValido` del dictamen y las
   * imágenes se purgan en el servidor (no se almacenan en disco).
   */
  validarIdentidad() {
    const anverso = this.dniFrontal();
    const reverso = this.dniPosterior();

    this.identidadError.set('');
    this.identidadResultado.set('');
    this.identidadVerificada.set(false);

    if (!anverso || !reverso) {
      this.identidadError.set('Debes adjuntar el anverso y el reverso del DNI antes de validar tu identidad.');
      return;
    }

    this.validandoIdentidad.set(true);
    this.iaService.verificarDniCompleto(anverso, reverso).subscribe({
      next: (res) => {
        this.validandoIdentidad.set(false);
        const isValido = res.estado === 'PROCESADO' && res.dniVerificado;
        this.identidadVerificada.set(isValido);
        if (res.estado === 'NO_DISPONIBLE') {
          this.identidadError.set(res.mensajeResultado);
        } else {
          this.identidadResultado.set(res.mensajeResultado);
        }
      },
      error: (err) => {
        this.validandoIdentidad.set(false);
        this.identidadError.set(err.error?.message || 'No se pudo validar la identidad. Intenta nuevamente.');
      },
    });
  }

  onSubmit() {
    if (this.cuentaCreada()) return;
    if (!this.passwordsMatch) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    const anverso = this.dniFrontal();
    const reverso = this.dniPosterior();
    const hayDni = anverso !== null || reverso !== null;

    if (hayDni && (!anverso || !reverso || !this.identidadVerificada())) {
      this.dniError.set('Adjunta y valida el anverso y reverso del DNI antes de registrarte.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.dniError.set('');

    const body = {
      ...this.form,
      'contraseña': this.contrasena,
      tipoRegistro: 'DONANTE' as const,
      // El teléfono es opcional (TC-FUNC-01): no se envía vacío.
      telefonoUsuario: this.form.telefonoUsuario.trim() || undefined,
    };

    this.auth.register(body).subscribe({
      next: (user) => {
        this.cuentaCreada.set(user);
        if (!hayDni) {
          this.finalizarRegistro();
          return;
        }

        // RF18: no se suben fotos del DNI como evidencia. Se revalidan ambas caras
        // y el backend solo persiste la bandera dniVerificado, purgando cualquier
        // archivo o registro biométrico que hubiera quedado de versiones anteriores.
        this.iaService.verificarDniCompleto(anverso!, reverso!, user.idUsuario, user.token).subscribe({
          next: (res) => {
            if (res.dniVerificado) {
              this.finalizarRegistro();
            } else {
              this.registroConDniPendiente(res.mensajeResultado);
            }
          },
          error: () => this.registroConDniPendiente('La evaluación de legibilidad no pudo completarse.'),
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrarse');
      },
    });
  }

  private registroConDniPendiente(detalle: string) {
    this.limpiarFotosDni();
    this.loading.set(false);
    this.exito.set(true);
    this.verificacionPendiente.set(true);
    this.identidadResultado.set('');
    this.identidadError.set(`${detalle} Tu cuenta se creó sin DNI verificado. Inicia sesión para reintentar.`);
  }

  /**
   * TC-FUNC-01: muestra el toast "Usuario registrado exitosamente" y redirige a la
   * vista de inicio de sesión, donde la alerta permanece visible para el usuario.
   */
  private finalizarRegistro() {
    this.limpiarFotosDni();
    this.loading.set(false);
    this.exito.set(true);
    setTimeout(() => {
      this.router.navigate(['/login'], { queryParams: { registro: 'exito' } });
    }, 1500);
  }

  private limpiarFotosDni() {
    if (this.dniFrontalPreview()) URL.revokeObjectURL(this.dniFrontalPreview()!);
    if (this.dniPosteriorPreview()) URL.revokeObjectURL(this.dniPosteriorPreview()!);
    this.dniFrontal.set(null);
    this.dniPosterior.set(null);
    this.dniFrontalPreview.set(null);
    this.dniPosteriorPreview.set(null);
  }
}
