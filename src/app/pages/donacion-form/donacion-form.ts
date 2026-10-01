import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DonacionService } from '../../services/donacion.service';
import { CategoriaService } from '../../services/categoria.service';
import { LocalService } from '../../services/local.service';
import { SessionService } from '../../services/session.service';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { Categoria } from '../../models/categoria.model';
import { Local } from '../../models/local.model';
import { Usuario } from '../../models/usuario.model';
import { DetalleDonacionRegistroRequest } from '../../models/donacion.model';

interface DetalleForm {
  idCategoria: number;
  descripcionDetalle: string;
  cantidadDeclarada: number;
  fechaVencimiento: string;
}

@Component({
  selector: 'app-donacion-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './donacion-form.html',
})
export class DonacionFormComponent implements OnInit {
  private donacionService = inject(DonacionService);
  private categoriaService = inject(CategoriaService);
  private localService = inject(LocalService);
  private session = inject(SessionService);
  private usuarioService = inject(UsuarioService);
  private auth = inject(AuthService);

  user = this.session.getUser();
  esDonante = this.user?.nombreRol === 'Donante';

  categorias = signal<Categoria[]>([]);
  locales = signal<Local[]>([]);
  donantes = signal<Usuario[]>([]);

  form = {
    idUsuario: this.esDonante ? (this.user?.idUsuario ?? 0) : 0,
    idLocalRecepcion: 0,
  };

  detalles = signal<DetalleForm[]>([this.nuevaFila()]);

  detallesValidos = signal(true);
  error = signal('');
  loading = signal(false);
  creada = signal<{ idDonacion: number; codigoSeguimiento: string } | null>(null);

  dialogoDonante = signal(false);
  creandoDonante = signal(false);
  donanteError = signal('');
  donanteForm = {
    dniUsuario: '',
    nombreUsuario: '',
    apellidosUsuario: '',
    correoUsuario: '',
    telefonoUsuario: '',
  };
  donanteContrasena = '';
  donanteContrasenaConfirm = '';

  ngOnInit() {
    this.categoriaService.listar().subscribe((data) => this.categorias.set(data));
    this.localService.listar().subscribe((data) => this.locales.set(data));
    this.recargarDonantes();
  }

  recargarDonantes() {
    this.usuarioService
      .listar()
      .subscribe((data) => this.donantes.set(data.filter((u) => u.nombreRol === 'Donante')));
  }

  abrirDialogoDonante() {
    this.donanteForm = {
      dniUsuario: '',
      nombreUsuario: '',
      apellidosUsuario: '',
      correoUsuario: '',
      telefonoUsuario: '',
    };
    this.donanteContrasena = '';
    this.donanteContrasenaConfirm = '';
    this.donanteError.set('');
    this.dialogoDonante.set(true);
  }

  cerrarDialogoDonante() {
    if (this.creandoDonante()) return;
    this.dialogoDonante.set(false);
  }

  get donantePasswordsMatch(): boolean {
    return this.donanteContrasena === this.donanteContrasenaConfirm;
  }

  crearDonante() {
    this.donanteError.set('');

    const f = this.donanteForm;
    if (!f.dniUsuario.trim() || !f.nombreUsuario.trim() || !f.apellidosUsuario.trim() || !f.correoUsuario.trim() || !f.telefonoUsuario.trim()) {
      this.donanteError.set('Completa todos los campos del donante.');
      return;
    }
    if (!this.donantePasswordsMatch) {
      this.donanteError.set('Las contraseñas no coinciden.');
      return;
    }
    if (!this.donanteContrasena) {
      this.donanteError.set('Ingresa una contraseña.');
      return;
    }

    this.creandoDonante.set(true);
    const body = { ...f, 'contraseña': this.donanteContrasena, tipoRegistro: 'DONANTE' as const };
    this.auth.register(body).subscribe({
      next: (usuario) => {
        this.creandoDonante.set(false);
        this.dialogoDonante.set(false);
        this.recargarDonantes();
        this.form.idUsuario = usuario.idUsuario;
      },
      error: (err) => {
        this.creandoDonante.set(false);
        this.donanteError.set(err.error?.message || 'Error al crear el donante');
      },
    });
  }

  nuevaFila(): DetalleForm {
    return {
      idCategoria: 0,
      descripcionDetalle: '',
      cantidadDeclarada: 0,
      fechaVencimiento: '',
    };
  }

  agregarDetalle() {
    this.detalles.update((rows) => [...rows, this.nuevaFila()]);
  }

  quitarDetalle(i: number) {
    this.detalles.update((rows) => rows.filter((_, idx) => idx !== i));
  }

  unidadDe(fila: DetalleForm): string {
    const cat = this.categorias().find((c) => c.idCategoria === fila.idCategoria);
    return cat ? cat.unidadMedCate : '';
  }

  formatearFecha(fecha: string): string | null {
    if (!fecha) return null;
    return `${fecha}T00:00:00`;
  }

  registrarOtra() {
    this.creada.set(null);
    this.form.idUsuario = this.esDonante ? (this.user?.idUsuario ?? 0) : 0;
    this.form.idLocalRecepcion = 0;
    this.detalles.set([this.nuevaFila()]);
    this.error.set('');
    this.detallesValidos.set(true);
  }

  validar() {
    const rows = this.detalles();
    const ok =
      rows.length > 0 &&
      rows.every((f) => f.idCategoria > 0 && f.cantidadDeclarada > 0) &&
      this.form.idLocalRecepcion > 0 &&
      this.form.idUsuario > 0;

    this.detallesValidos.set(ok);
    return ok;
  }

  onSubmit() {
    this.error.set('');

    if (!this.validar()) {
      this.error.set('Completa los campos obligatorios: local, donante, y al menos un detalle con categoría y cantidad mayor a 0.');
      return;
    }

    const payload = {
      idUsuario: this.form.idUsuario,
      idLocalRecepcion: this.form.idLocalRecepcion,
      detalles: this.detalles().map((f) => ({
        idCategoria: f.idCategoria,
        descripcionDetalle: f.descripcionDetalle,
        cantidadDeclarada: f.cantidadDeclarada,
        fechaVencimiento: this.formatearFecha(f.fechaVencimiento),
      })) as DetalleDonacionRegistroRequest[],
    };

    this.loading.set(true);

    this.donacionService.crear(payload).subscribe({
      next: (donacion) => {
        this.loading.set(false);
        this.creada.set({ idDonacion: donacion.idDonacion, codigoSeguimiento: donacion.codigoSeguimiento });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrar la donación');
      },
    });
  }
}