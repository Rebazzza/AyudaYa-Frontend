import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrabajadorService } from '../../services/trabajador.service';
import { LocalService } from '../../services/local.service';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { Trabajador, TrabajadorRequest } from '../../models/trabajador.model';
import { Local } from '../../models/local.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-trabajadores',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './trabajadores.html',
})
export class TrabajadoresComponent implements OnInit {
  private trabajadorService = inject(TrabajadorService);
  private localService = inject(LocalService);
  private usuarioService = inject(UsuarioService);
  private auth = inject(AuthService);

  trabajadores = signal<Trabajador[]>([]);
  locales = signal<Local[]>([]);
  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  saving = signal(false);
  desactivandoId = signal<number | null>(null);
  eliminandoId = signal<number | null>(null);
  error = signal('');
  success = signal('');
  showForm = signal(false);
  editandoId = signal<number | null>(null);

  dialogoUsuario = signal(false);
  creandoUsuario = signal(false);
  usuarioError = signal('');
  usuarioForm = {
    dniUsuario: '',
    nombreUsuario: '',
    apellidosUsuario: '',
    correoUsuario: '',
    telefonoUsuario: '',
  };
  usuarioContrasena = '';
  usuarioContrasenaConfirm = '';

  form: TrabajadorRequest = {
    idUsuario: 0,
    idLocal: 0,
    cargoTrabajador: '',
    fechaContratacion: '',
  };

  usuariosAsignados = computed(() => new Set(this.trabajadores().map((t) => t.idUsuario)));

  usuariosDisponibles = computed(() =>
    this.usuarios().filter((u) => {
      const editado = this.trabajadores().find((t) => t.idTrabajador === this.editandoId());
      return u.idUsuario === editado?.idUsuario || !this.usuariosAsignados().has(u.idUsuario);
    }),
  );

  ngOnInit() {
    this.cargar();
    this.localService.listar().subscribe((data) => this.locales.set(data));
    this.usuarioService.listar().subscribe((data) => this.usuarios.set(data));
  }

  cargar() {
    this.loading.set(true);
    this.trabajadorService.listar().subscribe({
      next: (data) => {
        this.trabajadores.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  abrirNuevo() {
    this.editandoId.set(null);
    this.form = { idUsuario: 0, idLocal: 0, cargoTrabajador: '', fechaContratacion: '' };
    this.error.set('');
    this.showForm.set(true);
  }

  abrirEdicion(t: Trabajador) {
    this.editandoId.set(t.idTrabajador);
    this.form = {
      idUsuario: t.idUsuario,
      idLocal: t.idLocal,
      cargoTrabajador: t.cargoTrabajador,
      fechaContratacion: t.fechaContratacion,
    };
    this.error.set('');
    this.showForm.set(true);
  }

  cancelar() {
    this.showForm.set(false);
    this.editandoId.set(null);
    this.error.set('');
  }

  guardar() {
    this.error.set('');
    this.success.set('');

    if (!this.form.idUsuario || !this.form.idLocal || !this.form.cargoTrabajador.trim()) {
      this.error.set('Usuario, local y cargo son obligatorios.');
      return;
    }

    this.saving.set(true);

    const request: TrabajadorRequest = {
      ...this.form,
      fechaContratacion: this.form.fechaContratacion || undefined,
    };

    const action = this.editandoId()
      ? this.trabajadorService.actualizar(this.editandoId()!, request)
      : this.trabajadorService.crear(request);

    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editandoId.set(null);
        this.success.set('Trabajador guardado correctamente.');
        this.cargar();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Error al guardar el trabajador');
      },
    });
  }

  /**
   * RF10 — baja lógica del trabajador. El backend marca `estadoActivo = false`
   * sin borrar el registro físico. No existe endpoint de reactivación todavía,
   * por lo que la confirmación advierte que la acción no se puede deshacer.
   */
  desactivar(t: Trabajador) {
    if (this.desactivandoId() !== null) return;

    const mensaje =
      `¿Desactivar a ${t.nombreCompletoUsuario}? Dejará de figurar como personal activo del local. ` +
      'El registro NO se elimina, pero por ahora no existe forma de reactivarlo desde la aplicación.';
    if (!confirm(mensaje)) return;

    this.error.set('');
    this.success.set('');
    this.desactivandoId.set(t.idTrabajador);

    this.trabajadorService.desactivar(t.idTrabajador).subscribe({
      next: () => {
        this.desactivandoId.set(null);
        this.success.set('Trabajador desactivado correctamente.');
        this.cargar();
      },
      error: (err) => {
        this.desactivandoId.set(null);
        this.error.set(err.error?.message || 'Error al desactivar el trabajador');
      },
    });
  }

  /**
   * Borrado físico del vínculo de trabajador (DELETE /trabajadores/{id}).
   * El backend desvincula historial de estados y donaciones antes de borrar
   * (antes el 500 por clave foránea salía sin cabeceras CORS y el navegador
   * lo reportaba como error de CORS). La cuenta del usuario NO se elimina.
   */
  eliminar(t: Trabajador) {
    if (this.desactivandoId() !== null || this.eliminandoId() !== null) return;

    const mensaje =
      `¿Eliminar el registro de trabajador de ${t.nombreCompletoUsuario}? ` +
      'Se borrará su vínculo con el local. La cuenta de usuario NO se elimina.';
    if (!confirm(mensaje)) return;

    this.error.set('');
    this.success.set('');
    this.eliminandoId.set(t.idTrabajador);

    this.trabajadorService.eliminar(t.idTrabajador).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.success.set('Trabajador eliminado correctamente. La cuenta de usuario se conserva.');
        this.cargar();
      },
      error: (err) => {
        this.eliminandoId.set(null);
        this.error.set(err.error?.message || 'Error al eliminar el trabajador');
      },
    });
  }

  abrirDialogoUsuario() {
    this.usuarioForm = {
      dniUsuario: '',
      nombreUsuario: '',
      apellidosUsuario: '',
      correoUsuario: '',
      telefonoUsuario: '',
    };
    this.usuarioContrasena = '';
    this.usuarioContrasenaConfirm = '';
    this.usuarioError.set('');
    this.dialogoUsuario.set(true);
  }

  cerrarDialogoUsuario() {
    if (this.creandoUsuario()) return;
    this.dialogoUsuario.set(false);
  }

  get usuarioPasswordsMatch(): boolean {
    return this.usuarioContrasena === this.usuarioContrasenaConfirm;
  }

  crearUsuario() {
    this.usuarioError.set('');

    const f = this.usuarioForm;
    if (!f.dniUsuario.trim() || !f.nombreUsuario.trim() || !f.apellidosUsuario.trim() || !f.correoUsuario.trim() || !f.telefonoUsuario.trim()) {
      this.usuarioError.set('Completa todos los campos del usuario.');
      return;
    }
    if (!this.usuarioContrasena) {
      this.usuarioError.set('Ingresa una contraseña.');
      return;
    }
    if (!this.usuarioPasswordsMatch) {
      this.usuarioError.set('Las contraseñas no coinciden.');
      return;
    }

    this.creandoUsuario.set(true);
    const body = { ...f, 'contraseña': this.usuarioContrasena, tipoRegistro: 'PERSONAL_APOYO' as const };
    this.auth.register(body).subscribe({
      next: (usuario) => {
        this.creandoUsuario.set(false);
        this.dialogoUsuario.set(false);
        this.usuarioService.listar().subscribe((data) => this.usuarios.set(data));
        this.form.idUsuario = usuario.idUsuario;
      },
      error: (err) => {
        this.creandoUsuario.set(false);
        this.usuarioError.set(err.error?.message || 'Error al crear el usuario');
      },
    });
  }
}