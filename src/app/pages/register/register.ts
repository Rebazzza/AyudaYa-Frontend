import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ImagenService } from '../../services/imagen.service';
import { IaService } from '../../services/ia.service';
import { RolRegistrable } from '../../models/usuario.model';
import { ImagenEvidencia } from '../../models/imagen.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private imagenService = inject(ImagenService);
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
  rolSeleccionado: RolRegistrable = 'DONANTE';

  loading = signal(false);
  error = signal('');
  /** TC-FUNC-01: alerta/toast de confirmación visible tras un registro exitoso. */
  exito = signal(false);
  showPassword = signal(false);
  showPasswordConfirm = signal(false);

  dniFrontal = signal<File | null>(null);
  dniPosterior = signal<File | null>(null);
  dniFrontalPreview = signal<string | null>(null);
  dniPosteriorPreview = signal<string | null>(null);
  dniError = signal('');

  /** TC-FUNC-03: estado de la verificación biométrica de las dos caras del DNI. */
  validandoIdentidad = signal(false);
  identidadVerificada = signal(false);
  identidadResultado = signal('');
  identidadError = signal('');

  formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  maxTamanoBytes = 10 * 1024 * 1024;

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
        const isValido = res.anversoValido && res.reversoValido;
        this.identidadVerificada.set(isValido);
        this.identidadResultado.set(
          `isValido: ${isValido} · ${res.mensajeResultado}` +
            (res.confianza != null ? ` (confianza ${(res.confianza * 100).toFixed(0)}%)` : ''),
        );
      },
      error: (err) => {
        this.validandoIdentidad.set(false);
        this.identidadError.set(err.error?.message || 'No se pudo validar la identidad. Intenta nuevamente.');
      },
    });
  }

  private subirDni(idUsuario: number) {
    const frontal = this.dniFrontal();
    const posterior = this.dniPosterior();
    const frontal$ = frontal
      ? this.imagenService.upload(frontal, 'DNI_FRONTAL', undefined, idUsuario)
      : of(null as ImagenEvidencia | null);
    const posterior$ = posterior
      ? this.imagenService.upload(posterior, 'DNI_POSTERIOR', undefined, idUsuario)
      : of(null as ImagenEvidencia | null);
    return forkJoin([frontal$, posterior$]);
  }

  onSubmit() {
    if (!this.passwordsMatch) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.dniError.set('');

    const body = {
      ...this.form,
      'contraseña': this.contrasena,
      tipoRegistro: this.rolSeleccionado,
      // El teléfono es opcional (TC-FUNC-01): no se envía vacío.
      telefonoUsuario: this.form.telefonoUsuario.trim() || undefined,
    };

    this.auth.register(body).subscribe({
      next: (user) => {
        const hayDni = this.rolSeleccionado === 'DONANTE' && (this.dniFrontal() || this.dniPosterior());

        if (hayDni && this.identidadVerificada() && this.dniFrontal()) {
          // TC-FUNC-03 · RF19: se persiste únicamente el estado verificado en MySQL;
          // las imágenes se purgan en el servidor (purga biométrica).
          this.iaService.verificarDni(user.idUsuario, this.dniFrontal()!).subscribe({
            next: () => this.finalizarRegistro(),
            error: () => this.finalizarRegistro(),
          });
          return;
        }

        if (!hayDni) {
          this.finalizarRegistro();
          return;
        }

        this.subirDni(user.idUsuario).subscribe({
          next: () => this.finalizarRegistro(),
          error: () => this.finalizarRegistro(),
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrarse');
      },
    });
  }

  /**
   * TC-FUNC-01: muestra el toast "Usuario registrado exitosamente" y redirige a la
   * vista de inicio de sesión, donde la alerta permanece visible para el usuario.
   */
  private finalizarRegistro() {
    this.loading.set(false);
    this.exito.set(true);
    setTimeout(() => {
      this.router.navigate(['/login'], { queryParams: { registro: 'exito' } });
    }, 1500);
  }
}