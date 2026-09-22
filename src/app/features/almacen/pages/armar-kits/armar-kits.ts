import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalService } from '../../../../services/local.service';
import { AlmacenService } from '../../../../services/almacen.service';
import { KitService } from '../../../../services/kit.service';
import { DocumentoService, descargarBlob } from '../../../../services/documento.service';
import { Local } from '../../../../models/local.model';
import { ResumenInventario } from '../../../../models/almacen.model';
import { ArmarKitRequest, InsumoKit, Kit } from '../../../../models/kit.model';

interface FilaInsumo {
  idCategoria: number;
  cantidad: number;
}

@Component({
  selector: 'app-armar-kits',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './armar-kits.html',
})
export class ArmarKitsComponent implements OnInit {
  private localService = inject(LocalService);
  private almacenService = inject(AlmacenService);
  private kitService = inject(KitService);
  private documentoService = inject(DocumentoService);

  locales = signal<Local[]>([]);
  idLocal = signal<number | null>(null);
  localesError = signal('');

  inventario = signal<ResumenInventario[]>([]);
  inventarioCargando = signal(false);

  nombreKit = '';
  cantidadKitsAFormar = 1;
  filas = signal<FilaInsumo[]>([{ idCategoria: 0, cantidad: 0 }]);

  armarError = signal('');
  armarIcono = signal(false);
  kitsCreados = signal<Kit[]>([]);

  imprimiendo = signal(false);
  imprimirError = signal('');

  toast = signal('');
  toastTipo = signal<'error' | 'exito'>('error');

  stockTotal = computed(() =>
    this.inventario().reduce((acc, i) => acc + (i.stockTotalVerificado ?? 0), 0),
  );

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.localService.listar().subscribe({
      next: (data) => {
        this.locales.set(data);
        if (data.length > 0) {
          this.idLocal.set(data[0].idLocal);
          this.cargarInventario();
        } else {
          this.localesError.set('No hay centros de acopio registrados.');
        }
      },
      error: () => this.localesError.set('No se pudieron cargar los centros de acopio.'),
    });
  }

  seleccionarLocal(event: Event) {
    this.idLocal.set(Number((event.target as HTMLSelectElement).value));
    this.kitsCreados.set([]);
    this.cargarInventario();
  }

  cargarInventario() {
    const idLocal = this.idLocal();
    if (idLocal == null) return;
    this.inventarioCargando.set(true);
    this.almacenService.obtenerInventario(idLocal).subscribe({
      next: (data) => {
        this.inventario.set(data);
        this.inventarioCargando.set(false);
        if (this.filas().length === 1 && this.filas()[0].idCategoria === 0 && data.length > 0) {
          this.filas.set([{ idCategoria: data[0].idCategoria, cantidad: 1 }]);
        }
      },
      error: (err) => {
        this.inventario.set([]);
        this.inventarioCargando.set(false);
        this.armarError.set(err?.error?.message ?? err?.message ?? 'No se pudo cargar el inventario.');
      },
    });
  }

  stockDe(idCategoria: number): number {
    return this.inventario().find((i) => i.idCategoria === idCategoria)?.stockTotalVerificado ?? 0;
  }

  unidadDe(idCategoria: number): string {
    return this.inventario().find((i) => i.idCategoria === idCategoria)?.unidadMedida ?? '';
  }

  agregarFila() {
    this.filas.update((rows) => [...rows, { idCategoria: 0, cantidad: 1 }]);
  }

  quitarFila(i: number) {
    this.filas.update((rows) => rows.filter((_, idx) => idx !== i));
  }

  mostrarToast(msg: string, tipo: 'error' | 'exito') {
    this.toast.set(msg);
    this.toastTipo.set(tipo);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 6000);
  }

  armar() {
    this.armarError.set('');
    this.armarIcono.set(false);

    const idLocal = this.idLocal();
    if (idLocal == null) {
      this.armarError.set('Selecciona un centro de acopio.');
      return;
    }
    const nombreKit = this.nombreKit.trim();
    if (!nombreKit) {
      this.armarError.set('Ingresa un nombre para el kit.');
      return;
    }
    const cantidadKits = this.cantidadKitsAFormar;
    if (!cantidadKits || cantidadKits < 1) {
      this.armarError.set('La cantidad de kits a formar debe ser al menos 1.');
      return;
    }
    const insumos: InsumoKit[] = this.filas()
      .filter((f) => f.idCategoria > 0 && f.cantidad > 0)
      .map((f) => ({ idCategoria: f.idCategoria, cantidad: f.cantidad }));
    if (insumos.length === 0) {
      this.armarError.set('Agrega al menos un insumo con categoría y cantidad mayor a 0.');
      return;
    }

    const body: ArmarKitRequest = {
      idLocal,
      nombreKit,
      cantidadKitsAFormar: cantidadKits,
      insumosPorKit: insumos,
    };

    this.armarIcono.set(true);
    this.kitsCreados.set([]);
    this.kitService.armarKits(body).subscribe({
      next: (kits) => {
        this.armarIcono.set(false);
        this.kitsCreados.set(kits);
        this.mostrarToast(`${kits.length} kit(s) armado(s) correctamente.`, 'exito');
        this.cargarInventario();
      },
      error: (err) => {
        this.armarIcono.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'No se pudieron armar los kits.';
        this.mostrarToast(msg, 'error');
      },
    });
  }

  descargarEtiquetas() {
    const codigos = this.kitsCreados().map((k) => k.codigoKit);
    if (codigos.length === 0 || this.imprimiendo()) return;
    this.imprimiendo.set(true);
    this.imprimirError.set('');
    this.documentoService.generarEtiquetas(codigos).subscribe({
      next: (blob) => {
        descargarBlob(blob, 'etiquetas-kits-qr.pdf');
        this.imprimiendo.set(false);
        this.mostrarToast(`Descargadas ${codigos.length} etiquetas (PDF).`, 'exito');
      },
      error: (err) => {
        this.imprimiendo.set(false);
        this.imprimirError.set(err?.message ?? 'No se pudieron generar las etiquetas.');
      },
    });
  }
}