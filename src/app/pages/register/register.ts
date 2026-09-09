import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { RolRegistrable } from '../../models/usuario.model';

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

  get passwordsMatch(): boolean {
    return this.contrasena === this.contrasenaConfirm;
  }

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  toggleShowPasswordConfirm() {
    this.showPasswordConfirm.update((v) => !v);
  }

  onSubmit() {
    if (!this.passwordsMatch) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const body = { ...this.form, 'contraseña': this.contrasena, tipoRegistro: this.rolSeleccionado };

    this.auth.register(body).subscribe({
      next: (user) => {
        this.session.setUser(user);
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrarse');
      },
    });
  }
}
