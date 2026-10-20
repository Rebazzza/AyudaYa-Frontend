import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { RolRegistrable } from '../../models/usuario.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private session = inject(SessionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** TC-FUNC-02: mensaje exacto exigido por el plan de pruebas funcionales. */
  static readonly MENSAJE_CREDENCIALES =
    'Credenciales incorrectas. Verifique su correo y contraseña';

  correoUsuario = '';
  contrasena = '';
  rememberMe = true;
  perfilSeleccionado: RolRegistrable = 'DONANTE';
  perfil = signal<'donante' | 'acopio'>('donante');

  loading = signal(false);
  error = signal('');
  /** TC-FUNC-01: la alerta "Usuario registrado exitosamente" permanece tras la redirección. */
  registroExitoso = this.route.snapshot.queryParamMap.get('registro') === 'exito';
  showPassword = signal(false);

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  seleccionarPerfil(perfil: 'donante' | 'acopio') {
    this.perfil.set(perfil);
  }

  dniLogin() {
    alert('Inicio de sesión con DNIe / Clave Digital próximamente.');
  }

  private redirectAfterLogin() {
    const redirect = this.router.parseUrl(this.router.url).queryParamMap.get('redirect');
    const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/';
    this.router.navigateByUrl(safeRedirect);
  }

  onSubmit() {
    this.error.set('');

    if (!this.correoUsuario.trim() || !this.contrasena) {
      this.error.set('Ingresa tu correo o DNI y tu contraseña.');
      return;
    }

    this.loading.set(true);

    this.auth.login({ correoUsuario: this.correoUsuario, 'contraseña': this.contrasena }).subscribe({
      next: (user) => {
        this.session.setUser(user, this.rememberMe);
        this.loading.set(false);
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || LoginComponent.MENSAJE_CREDENCIALES);
      },
    });
  }
}