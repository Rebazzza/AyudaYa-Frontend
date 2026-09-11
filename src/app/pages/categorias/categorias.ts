import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { SessionService } from '../../services/session.service';
import { Categoria, CategoriaRequest } from '../../models/categoria.model';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './categorias.html',
})
export class CategoriasComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private session = inject(SessionService);

  esDonante = this.session.getUser()?.nombreRol === 'Donante';

  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  showForm = signal(false);
  editandoId = signal<number | null>(null);

  form: CategoriaRequest = {
    nombreCategoria: '',
    unidadMedCate: '',
    refrigerar: false,
  };

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  abrirNueva() {
    this.editandoId.set(null);
    this.form = { nombreCategoria: '', unidadMedCate: '', refrigerar: false };
    this.error.set('');
    this.showForm.set(true);
  }

  abrirEdicion(c: Categoria) {
    this.editandoId.set(c.idCategoria);
    this.form = {
      nombreCategoria: c.nombreCategoria,
      unidadMedCate: c.unidadMedCate,
      refrigerar: c.refrigerar,
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
    if (!this.form.nombreCategoria.trim() || !this.form.unidadMedCate.trim()) {
      this.error.set('El nombre y la unidad de medida son obligatorios.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const request = {
      ...this.form,
      refrigerar: this.form.refrigerar ?? false,
    };

    const action = this.editandoId()
      ? this.categoriaService.actualizar(this.editandoId()!, request)
      : this.categoriaService.crear(request);

    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editandoId.set(null);
        this.cargar();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Error al guardar la categoría');
      },
    });
  }

  eliminar(id: number, nombre: string) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;

    this.categoriaService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        this.error.set(err.error?.message || 'No se pudo eliminar la categoría');
      },
    });
  }
}