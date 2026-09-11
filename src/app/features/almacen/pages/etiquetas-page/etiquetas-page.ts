import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DonacionService } from '../../../../services/donacion.service';
import { DocumentoService, descargarBlob } from '../../../../services/documento.service';
import { Donacion } from '../../../../models/donacion.model';
import { NotificarTestRequest } from '../../../../models/documento.model';

@Component({
  selector: 'app-etiquetas-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './etiquetas-page.html',
})
export class EtiquetasPageComponent implements OnInit {
  private donacionService = inject(DonacionService);
  private documentoService = inject(DocumentoService);

  donaciones = signal<Donacion[]>([]);
  seleccionadas = signal<number[]>([]);
  loading = signal(true);
  error = signal('');

  imprimiendo = signal(false);
  impresionExito = signal('');
  impresionError = signal('');

  testForm: NotificarTestRequest = {
    correoDestino: '',
    nombreDonante: '',
    codigoSeguimiento: '',
    nuevoEstado: '',
    nombreLocal: '',
  };
  enviandoTest = signal(false);
  testMensaje = signal('');
  testError = signal('');

  seleccionadasCount = computed(() => this.seleccionadas().length);

  todasSeleccionadas = computed(
    () => this.donaciones().length > 0 && this.seleccionadas().length === this.donaciones().length,
  );

  ngOnInit() {
    this.donacionService.listar().subscribe({
      next: (data) => {
        this.donaciones.set(data.filter((d) => d.estadoActual === 'EN_ALMACEN'));
        this.loading.set(false);
      },
      error: () => {
        this.donaciones.set([]);
        this.loading.set(false);
        this.error.set('No se pudieron cargar las donaciones en almacén.');
      },
    });
  }

  toggleTodas(event: Event) {
    const marcadas = (event.target as HTMLInputElement).checked;
    this.seleccionadas.set(marcadas ? this.donaciones().map((d) => d.idDonacion) : []);
    this.impresionExito.set('');
    this.impresionError.set('');
  }

  toggle(d: Donacion) {
    this.seleccionadas.update((prev) =>
      prev.includes(d.idDonacion)
        ? prev.filter((id) => id !== d.idDonacion)
        : [...prev, d.idDonacion],
    );
    this.impresionExito.set('');
    this.impresionError.set('');
  }

  imprimir() {
    const codigos = this.donaciones()
      .filter((d) => this.seleccionadas().includes(d.idDonacion))
      .map((d) => d.codigoSeguimiento);
    if (codigos.length === 0) return;

    this.imprimiendo.set(true);
    this.impresionExito.set('');
    this.impresionError.set('');
    this.documentoService.generarEtiquetas(codigos).subscribe({
      next: (blob) => {
        descargarBlob(blob, 'etiquetas-qr.pdf');
        this.imprimiendo.set(false);
        this.impresionExito.set(`Impresas ${codigos.length} etiquetas correctamente.`);
      },
      error: (err) => {
        this.imprimiendo.set(false);
        this.impresionError.set(err?.message ?? 'No se pudieron generar las etiquetas.');
      },
    });
  }

  enviarTest() {
    const data = this.testForm;
    if (
      !data.correoDestino ||
      !data.nombreDonante ||
      !data.codigoSeguimiento ||
      !data.nuevoEstado ||
      !data.nombreLocal
    ) {
      this.testError.set('Completa todos los campos para probar el correo.');
      return;
    }
    this.enviandoTest.set(true);
    this.testMensaje.set('');
    this.testError.set('');
    this.documentoService.notificarTest(data).subscribe({
      next: () => {
        this.enviandoTest.set(false);
        this.testMensaje.set('Correo de prueba enviado correctamente.');
      },
      error: (err) => {
        this.enviandoTest.set(false);
        this.testError.set(err?.error?.message ?? err?.message ?? 'No se pudo enviar el correo de prueba. Revisa la configuración SMTP.');
      },
    });
  }
}