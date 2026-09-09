import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocalService } from '../../services/local.service';

@Component({
  selector: 'app-local-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './local-form.html',
})
export class LocalFormComponent {
  private localService = inject(LocalService);
  private router = inject(Router);

  form = {
    nombreLocal: '',
    direccionLocal: '',
    latitud: 0,
    longitud: 0,
    capacidadLocalM3: 0,
    telefonoLocal: '',
  };

  loading = signal(false);
  error = signal('');

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    this.localService.registrar(this.form).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrar el local');
      },
    });
  }
}
