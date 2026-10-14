import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
  exito = signal('');
  marcandoTodo = signal(false);

  noLeidas = computed(() => this.notificaciones().filter((n) => !n.leido).length);

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
    this.notificacionService.marcarLeida(n.idNotificacion).subscribe(() => {
      this.notificaciones.update((rows) =>
        rows.map((r) => (r.idNotificacion === n.idNotificacion ? { ...r, leido: true } : r)),
      );
    });
  }

  eliminar(idNotificacion: number) {
    this.notificacionService.eliminar(idNotificacion).subscribe(() => {
      this.notificaciones.update((rows) => rows.filter((r) => r.idNotificacion !== idNotificacion));
    });
  }

  marcarTodasLeidas() {
    if (this.marcandoTodo() || this.noLeidas() === 0) return;
    this.marcandoTodo.set(true);
    this.error.set('');
    this.exito.set('');
    this.notificacionService.marcarTodoLeido(this.session.getUser()!.idUsuario).subscribe({
      next: (cantidad) => {
        this.marcandoTodo.set(false);
        this.notificaciones.update((rows) => rows.map((r) => (r.leido ? r : { ...r, leido: true })));
        this.exito.set(
          cantidad > 0
            ? `${cantidad} notificación(es) marcada(s) como leída(s).`
            : 'No tenías notificaciones pendientes.',
        );
      },
      error: (err) => {
        this.marcandoTodo.set(false);
        this.error.set(err.error?.message || 'No se pudieron marcar las notificaciones');
      },
    });
  }
}