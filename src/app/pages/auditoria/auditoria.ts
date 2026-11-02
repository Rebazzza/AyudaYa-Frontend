import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../services/auditoria.service';
import { Auditoria, FiltrosAuditoria } from '../../models/auditoria.model';
import { PaginationComponent } from '../../components/pagination/pagination';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [FormsModule, DatePipe, PaginationComponent],
  templateUrl: './auditoria.html',
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);

  registros = signal<Auditoria[]>([]);
  total = signal(0);
  pagina = signal(0);
  tamanio = 20;
  loading = signal(true);
  error = signal('');

  filtros: FiltrosAuditoria = this.filtrosVacios();

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set('');

    this.auditoriaService.listar(this.filtros, this.pagina(), this.tamanio).subscribe({
      next: (resultado) => {
        this.registros.set(resultado.contenido);
        this.total.set(resultado.totalElementos);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'No se pudo cargar el registro de auditoria');
        this.loading.set(false);
      },
    });
  }

  aplicarFiltros() {
    this.pagina.set(0);
    this.cargar();
  }

  limpiarFiltros() {
    this.filtros = this.filtrosVacios();
    this.pagina.set(0);
    this.cargar();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina === this.pagina()) return;
    this.pagina.set(nuevaPagina);
    this.cargar();
  }

  etiquetaAccion(accion: string): string {
    return accion.replaceAll('_', ' ');
  }

  private filtrosVacios(): FiltrosAuditoria {
    return {
      idUsuario: null,
      accion: '',
      entidad: '',
      fechaDesde: '',
      fechaHasta: '',
    };
  }
}
