import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IaService } from '../../services/ia.service';
import { SessionService } from '../../services/session.service';
import { IMAGE_ALLOWED_TYPES, MAX_IMAGE_SIZE_BYTES } from '../../shared/config/file-upload.config';

@Component({
  selector: 'app-evaluar-dni',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './evaluar-dni.html',
})
export class EvaluarDniComponent {
  private ia = inject(IaService);
  private session = inject(SessionService);

  anverso = signal<File | null>(null);
  reverso = signal<File | null>(null);
  procesando = signal(false);
  mensaje = signal('');
  error = signal('');
  verificado = signal(!!this.session.getUser()?.dniVerificado);

  seleccionar(event: Event, lado: 'anverso' | 'reverso') {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = '';
    this.error.set('');
    this.mensaje.set('');
    if (!archivo) return;
    if (!IMAGE_ALLOWED_TYPES.includes(archivo.type) || archivo.size > MAX_IMAGE_SIZE_BYTES) {
      this.error.set('Selecciona una imagen JPG, PNG o WebP de máximo 10 MB.');
      return;
    }
    if (lado === 'anverso') this.anverso.set(archivo);
    else this.reverso.set(archivo);
  }

  evaluar() {
    const usuario = this.session.getUser();
    const anverso = this.anverso();
    const reverso = this.reverso();
    if (!usuario?.token || !anverso || !reverso) {
      this.error.set('Adjunta las dos caras del DNI para evaluar su legibilidad.');
      return;
    }
    this.procesando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.ia.verificarDniCompleto(anverso, reverso, usuario.idUsuario, usuario.token).subscribe({
      next: (resultado) => {
        this.procesando.set(false);
        if (resultado.dniVerificado) {
          this.verificado.set(true);
          this.session.updateUser({ dniVerificado: true });
          this.mensaje.set('Las dos fotos superaron la evaluación de legibilidad.');
          this.anverso.set(null);
          this.reverso.set(null);
        } else if (resultado.estado === 'NO_DISPONIBLE') {
          this.error.set('La evaluación no está disponible temporalmente. Intenta nuevamente.');
        } else {
          this.error.set('Una o ambas fotos no superaron la evaluación de legibilidad. Puedes elegir otras fotos.');
        }
      },
      error: () => {
        this.procesando.set(false);
        this.error.set('No se pudo completar la evaluación. Intenta nuevamente.');
      },
    });
  }
}
