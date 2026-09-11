import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { ImagenService } from '../../services/imagen.service';
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
  private session = inject(SessionService);
  private router = inject(Router);
  private imagenService = inject(ImagenService);

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
  showPassword = signal(false);
  showPasswordConfirm = signal(false);

  dniFrontal = signal<File | null>(null);
  dniPosterior = signal<File | null>(null);
  dniFrontalPreview = signal<string | null>(null);
  dniPosteriorPreview = signal<string | null>(null);
  dniError = signal('');

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

    const body = { ...this.form, 'contraseña': this.contrasena, tipoRegistro: this.rolSeleccionado };

    this.auth.register(body).subscribe({
      next: (user) => {
        this.session.setUser(user);
        const hayDni = this.rolSeleccionado === 'DONANTE' && (this.dniFrontal() || this.dniPosterior());
        if (!hayDni) {
          this.loading.set(false);
          this.router.navigate(['/']);
          return;
        }
        this.subirDni(user.idUsuario).subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.loading.set(false);
            this.dniError.set('Cuenta creada, pero no se pudo cargar el DNI: ' + (err.error?.message ?? 'intenta nuevamente'));
            this.router.navigate(['/']);
          },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrarse');
      },
    });
  }
}