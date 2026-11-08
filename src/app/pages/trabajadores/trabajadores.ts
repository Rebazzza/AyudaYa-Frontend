import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrabajadorService } from '../../services/trabajador.service';
import { LocalService } from '../../services/local.service';
import { UsuarioService } from '../../services/usuario.service';
import { Auditoria } from '../../models/auditoria.model';
import { Trabajador, TrabajadorRequest } from '../../models/trabajador.model';
import { Local } from '../../models/local.model';
import { Usuario } from '../../models/usuario.model';
import { PaginationComponent, paginar } from '../../components/pagination/pagination';

@Component({
  selector: 'app-trabajadores',
  standalone: true,
  imports: [FormsModule, DatePipe, PaginationComponent],
  templateUrl: './trabajadores.html',
})
export class TrabajadoresComponent implements OnInit {
  private trabajadorService = inject(TrabajadorService);
  private localService = inject(LocalService);
  private usuarioService = inject(UsuarioService);

  trabajadores = signal<Trabajador[]>([]);
  locales = signal<Local[]>([]);
  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  saving = signal(false);
  desactivandoId = signal<number | null>(null);
  reactivandoId = signal<number | null>(null);
  mostrarInactivos = signal(false);
  historial = signal<Auditoria[]>([]);
  historialTrabajador = signal<Trabajador | null>(null);
  cargandoHistorial = signal(false);
  error = signal('');
  success = signal('');
  showForm = signal(false);
  editandoId = signal<number | null>(null);

  pagina = signal(0);
  trabajadoresVisibles = computed(() => this.trabajadores().filter(t =>
    this.mostrarInactivos() ? t.estadoActivo === false : t.estadoActivo !== false));
  paginaTrabajadores = paginar(this.trabajadoresVisibles, this.pagina, 10);

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
      return u.nombreRol !== 'Donante' &&
        (u.idUsuario === editado?.idUsuario || !this.usuariosAsignados().has(u.idUsuario));
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

  desactivar(t: Trabajador) {
    if (this.desactivandoId() !== null) return;

    const mensaje = `¿Desactivar a ${t.nombreCompletoUsuario}? Se ocultará de la lista de personal activo y se conservará su historial.`;
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

  reactivar(t: Trabajador) {
    if (this.reactivandoId() !== null) return;
    this.error.set('');
    this.success.set('');
    this.reactivandoId.set(t.idTrabajador);
    this.trabajadorService.reactivar(t.idTrabajador).subscribe({
      next: () => {
        this.reactivandoId.set(null);
        this.success.set('Trabajador reactivado correctamente.');
        this.cargar();
      },
      error: (err) => {
        this.reactivandoId.set(null);
        this.error.set(err.error?.message || 'Error al reactivar el trabajador');
      },
    });
  }

  verHistorial(t: Trabajador) {
    this.historialTrabajador.set(t);
    this.historial.set([]);
    this.cargandoHistorial.set(true);
    this.trabajadorService.historial(t.idTrabajador).subscribe({
      next: eventos => {
        this.historial.set(eventos);
        this.cargandoHistorial.set(false);
      },
      error: err => {
        this.cargandoHistorial.set(false);
        this.error.set(err.error?.message || 'Error al consultar el historial');
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
    this.usuarioService.crear(body).subscribe({
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
