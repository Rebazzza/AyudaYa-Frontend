import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificacionService } from '../../services/notificacion.service';
import { SessionService } from '../../services/session.service';
import { Notificacion } from '../../models/notificacion.model';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notificaciones.html',
})
export class NotificacionesComponent implements OnInit {
  private notificacionService = inject(NotificacionService);
  private session = inject(SessionService);

  notificaciones = signal<Notificacion[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);

    this.notificacionService.listarPorUsuario(this.session.getUser()!.idUsuario).subscribe({
      next: (data) => {
        this.notificaciones.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al cargar notificaciones');
      },
    });
  }

  marcarLeida(n: Notificacion) {
    if (n.leido) return;
    this.notificacionService.marcarLeida(n.idNoti).subscribe(() => {
      this.notificaciones.update((rows) =>
        rows.map((r) => (r.idNoti === n.idNoti ? { ...r, leido: true } : r)),
      );
    });
  }

  eliminar(idNoti: number) {
    this.notificacionService.eliminar(idNoti).subscribe(() => {
      this.notificaciones.update((rows) => rows.filter((r) => r.idNoti !== idNoti));
    });
  }
}