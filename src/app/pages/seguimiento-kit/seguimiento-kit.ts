import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { KitService } from '../../services/kit.service';
import { Kit } from '../../models/kit.model';

@Component({
  selector: 'app-seguimiento-kit',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './seguimiento-kit.html',
})
export class SeguimientoKitComponent {
  private kitService = inject(KitService);

  codigoInput = signal('');
  buscando = signal(false);
  kit = signal<Kit | null>(null);
  error = signal('');
  buscado = signal(false);

  claseEstado(estado: string): string {
    switch (estado) {
      case 'DISPONIBLE': return 'bg-primary-fixed text-on-primary-fixed';
      case 'RESERVADO': return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'ENTREGADO': return 'bg-surface-container-high text-on-surface';
      default: return 'bg-surface-container-high text-on-surface';
    }
  }

  busqueda = computed(() => this.codigoInput().trim().toUpperCase());

  buscar() {
    const codigo = this.busqueda();
    if (!codigo) return;
    this.buscando.set(true);
    this.error.set('');
    this.kit.set(null);
    this.buscado.set(true);

    this.kitService.getKitPorCodigo(codigo).subscribe({
      next: (kit) => {
        this.buscando.set(false);
        this.kit.set(kit);
      },
      error: (err) => {
        this.buscando.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'No se encontró el kit con ese código.');
      },
    });
  }
}