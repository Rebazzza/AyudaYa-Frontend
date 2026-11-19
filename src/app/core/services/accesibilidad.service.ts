import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TamanoFuente = 'normal' | 'grande' | 'extra';

export interface AccesibilidadConfig {
  /** Intensifica texto, estados y bordes para separarlos del fondo. */
  contrasteEquilibrado: boolean;
  /** Refuerza bordes, contrastes, subrayados e iconos de estado. */
  daltonismo: boolean;
  /** Lee en voz alta los elementos clave al enfocarlos o seleccionarlos. */
  narracionActiva: boolean;
  /** Aumenta el espaciado y alinea el texto a la izquierda. */
  dislexia: boolean;
  /** Elimina desenfoques y fondos translúcidos. Desactivado por defecto. */
  sinTransparencias: boolean;
  /** Escala tipográfica global: 100 %, 112 % o 125 %. */
  tamanoFuente: TamanoFuente;
}

export const ACCESIBILIDAD_CONFIG_INICIAL: AccesibilidadConfig = {
  contrasteEquilibrado: false,
  daltonismo: false,
  narracionActiva: false,
  dislexia: false,
  sinTransparencias: false,
  tamanoFuente: 'normal',
};

const CLAVE_ALMACENAMIENTO = 'ayudaya_accesibilidad';

const CLASES_ACCESIBILIDAD = [
  'acc-contraste-equilibrado',
  'acc-daltonismo',
  'acc-dislexia',
  'acc-sin-transparencias',
  'acc-fuente-normal',
  'acc-fuente-grande',
  'acc-fuente-extra',
] as const;

const SELECTOR_NARRACION =
  'h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,label,legend,a,button,[role="alert"],[role="status"],[class*="rounded-full"][class*="font-semibold"]';

/**
 * Servicio central del módulo de accesibilidad.
 *
 * No contiene lógica de negocio ni toca servicios HTTP: únicamente mantiene
 * las preferencias del usuario, sincroniza clases en <body> y gestiona la
 * narración con la API nativa del navegador.
 */
@Injectable({ providedIn: 'root' })
export class AccesibilidadService implements OnDestroy {
  private readonly configSubject = new BehaviorSubject<AccesibilidadConfig>(this.cargarConfig());
  private readonly leyendoSubject = new BehaviorSubject<boolean>(false);

  /** Estado reactivo que consume el panel de accesibilidad. */
  readonly config$ = this.configSubject.asObservable();
  readonly leyendo$ = this.leyendoSubject.asObservable();

  private ultimoTexto = '';
  private ultimoMomento = 0;
  private temporizadorVoz: number | null = null;
  private utteranceActual: SpeechSynthesisUtterance | null = null;
  private escuchaInstalada = false;

  constructor() {
    this.aplicarConfig(this.configSubject.value);
    this.instalarEscuchaAsistida();
  }

  get configActual(): AccesibilidadConfig {
    return this.configSubject.value;
  }

  get soportaNarracion(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    );
  }

  /**
   * Actualiza solo las claves enviadas, persiste y sincroniza el <body>.
   */
  actualizarConfig(parcial: Partial<AccesibilidadConfig>): void {
    const anterior = this.configActual;
    const siguiente = this.normalizar({ ...anterior, ...parcial });

    if (anterior.narracionActiva && !siguiente.narracionActiva) {
      this.detenerLectura();
    }

    this.guardarConfig(siguiente);
    this.configSubject.next(siguiente);
    this.aplicarConfig(siguiente);
  }

  /**
   * Vuelve a los valores iniciales («Eliminar transparencias» desactivado).
   */
  restablecer(): void {
    this.detenerLectura();
    const inicial = { ...ACCESIBILIDAD_CONFIG_INICIAL };
    this.guardarConfig(inicial);
    this.configSubject.next(inicial);
    this.aplicarConfig(inicial);
  }

  /**
   * Narra un texto en español (es-PE). Cancela cualquier lectura anterior para
   * evitar solapamientos.
   *
   * @param texto Contenido a leer.
   * @param forzar Si es true, lee aunque la narración asistida esté apagada
   *               (se usa desde el botón "Leer página o selección").
   */
  narrar(texto: string, forzar = false): void {
    if (!this.soportaNarracion) return;
    if (!forzar && !this.configActual.narracionActiva) return;

    const limpio = (texto ?? '').replace(/\s+/g, ' ').trim().slice(0, 2200);
    if (!limpio) return;

    const ahora = Date.now();
    if (!forzar && limpio === this.ultimoTexto && ahora - this.ultimoMomento < 1500) {
      return;
    }
    this.ultimoTexto = limpio;
    this.ultimoMomento = ahora;

    this.cancelarVozPendiente();

    const sintesis = window.speechSynthesis;
    sintesis.cancel();

    const utterance = new SpeechSynthesisUtterance(limpio);
    utterance.lang = 'es-PE';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voz = this.buscarVozEspanola(sintesis.getVoices());
    if (voz) utterance.voice = voz;

    utterance.onstart = () => {
      if (this.utteranceActual === utterance) this.leyendoSubject.next(true);
    };
    utterance.onend = () => {
      if (this.utteranceActual === utterance) {
        this.utteranceActual = null;
        this.leyendoSubject.next(false);
      }
    };
    utterance.onerror = () => {
      if (this.utteranceActual === utterance) {
        this.utteranceActual = null;
        this.leyendoSubject.next(false);
      }
    };

    this.utteranceActual = utterance;

    // Chrome requiere un pequeño margen después de cancel() para reproducir
    // con fiabilidad una nueva locución.
    this.temporizadorVoz = window.setTimeout(() => {
      this.temporizadorVoz = null;
      if (this.utteranceActual !== utterance) return;
      sintesis.speak(utterance);
    }, 40);
  }

  /** Detiene inmediatamente la locución actual. */
  detenerLectura(): void {
    this.cancelarVozPendiente();
    this.utteranceActual = null;
    if (this.soportaNarracion) {
      window.speechSynthesis.cancel();
    }
    this.leyendoSubject.next(false);
  }

  ngOnDestroy(): void {
    this.detenerLectura();
    this.quitarEscuchaAsistida();
    this.configSubject.complete();
    this.leyendoSubject.complete();
  }

  // ---------------------------------------------------------------------------
  // Persistencia y sincronización de clases
  // ---------------------------------------------------------------------------

  private aplicarConfig(config: AccesibilidadConfig): void {
    if (typeof document === 'undefined' || !document.body) return;
    const body = document.body;
    body.classList.remove(...CLASES_ACCESIBILIDAD);
    if (config.contrasteEquilibrado) body.classList.add('acc-contraste-equilibrado');
    if (config.daltonismo) body.classList.add('acc-daltonismo');
    if (config.dislexia) body.classList.add('acc-dislexia');
    if (config.sinTransparencias) body.classList.add('acc-sin-transparencias');
    body.classList.add(`acc-fuente-${config.tamanoFuente}`);
  }

  private cargarConfig(): AccesibilidadConfig {
    try {
      if (typeof localStorage === 'undefined') return { ...ACCESIBILIDAD_CONFIG_INICIAL };
      const crudo = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (!crudo) return { ...ACCESIBILIDAD_CONFIG_INICIAL };
      return this.normalizar(JSON.parse(crudo) as Partial<AccesibilidadConfig>);
    } catch {
      return { ...ACCESIBILIDAD_CONFIG_INICIAL };
    }
  }

  private guardarConfig(config: AccesibilidadConfig): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(config));
    } catch {
      // Almacenamiento no disponible o lleno: la sesión sigue funcionando.
    }
  }

  private normalizar(valor: Partial<AccesibilidadConfig> | null | undefined): AccesibilidadConfig {
    const base = { ...ACCESIBILIDAD_CONFIG_INICIAL };
    if (!valor || typeof valor !== 'object') return base;

    return {
      contrasteEquilibrado:
        typeof valor.contrasteEquilibrado === 'boolean'
          ? valor.contrasteEquilibrado
          : base.contrasteEquilibrado,
      daltonismo: typeof valor.daltonismo === 'boolean' ? valor.daltonismo : base.daltonismo,
      narracionActiva:
        typeof valor.narracionActiva === 'boolean' ? valor.narracionActiva : base.narracionActiva,
      dislexia: typeof valor.dislexia === 'boolean' ? valor.dislexia : base.dislexia,
      sinTransparencias:
        typeof valor.sinTransparencias === 'boolean'
          ? valor.sinTransparencias
          : base.sinTransparencias,
      tamanoFuente:
        valor.tamanoFuente === 'normal' ||
        valor.tamanoFuente === 'grande' ||
        valor.tamanoFuente === 'extra'
          ? valor.tamanoFuente
          : base.tamanoFuente,
    };
  }

  // ---------------------------------------------------------------------------
  // Narración asistida por clic / foco
  // ---------------------------------------------------------------------------

  private instalarEscuchaAsistida(): void {
    if (this.escuchaInstalada || typeof document === 'undefined') return;
    document.addEventListener('click', this.onDocumentClick, true);
    document.addEventListener('focusin', this.onDocumentFocus, true);
    this.escuchaInstalada = true;
  }

  private quitarEscuchaAsistida(): void {
    if (!this.escuchaInstalada || typeof document === 'undefined') return;
    document.removeEventListener('click', this.onDocumentClick, true);
    document.removeEventListener('focusin', this.onDocumentFocus, true);
    this.escuchaInstalada = false;
  }

  private readonly onDocumentClick = (event: Event): void => {
    if (!this.configActual.narracionActiva) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (this.debeIgnorar(target)) return;

    const elemento = target.closest<HTMLElement>(SELECTOR_NARRACION);
    if (!elemento) return;

    const texto = this.extraerTexto(elemento);
    this.narrar(texto);
  };

  private readonly onDocumentFocus = (event: FocusEvent): void => {
    if (!this.configActual.narracionActiva) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (this.debeIgnorar(target)) return;

    if (target.matches('input,select,textarea')) {
      const texto = this.extraerTextoDeCampo(target as HTMLElement);
      if (texto) this.narrar(texto);
      return;
    }

    if (!target.matches(SELECTOR_NARRACION)) return;
    const texto = this.extraerTexto(target as HTMLElement);
    this.narrar(texto);
  };

  private debeIgnorar(target: Element): boolean {
    if (target.closest('app-barra-accesibilidad, .acc-panel, [data-acc-sin-narracion]')) {
      return true;
    }
    return Boolean(target.closest('script, style, noscript'));
  }

  private extraerTexto(elemento: HTMLElement): string {
    const aria = elemento.getAttribute('aria-label')?.trim();
    if (aria) return this.limitarTexto(aria);

    // Se trabaja sobre una copia para no alterar el DOM. Se descartan los
    // iconos decorativos y aria-hidden: sus ligaduras (p. ej. "palette") no
    // deben leerse en voz alta (WCAG 2.2 · 1.1.1 y 4.1.2).
    const copia = elemento.cloneNode(true) as HTMLElement;
    copia
      .querySelectorAll(
        'script, style, noscript, svg, [aria-hidden="true"], [class*="material-symbols"], [class*="material-icons"], [class*=" icon"], [class^="icon-"], .fa, .fas, .far, .fab, .bi',
      )
      .forEach((nodo) => nodo.remove());

    const texto = (copia.textContent ?? '').replace(/\s+/g, ' ').trim();
    const titulo = elemento.getAttribute('title')?.trim();
    return this.limitarTexto(texto || titulo || '');
  }

  private extraerTextoDeCampo(campo: HTMLElement): string {
    const aria = campo.getAttribute('aria-label')?.trim();
    const placeholder = campo.getAttribute('placeholder')?.trim();
    const etiqueta =
      campo.id && typeof document !== 'undefined'
        ? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(campo.id)}"]`)
        : null;
    const textoEtiqueta = (etiqueta?.textContent ?? '').replace(/\s+/g, ' ').trim();
    return this.limitarTexto(aria || textoEtiqueta || placeholder || '');
  }

  private limitarTexto(texto: string): string {
    const limpio = texto.replace(/\s+/g, ' ').trim();
    return limpio.length > 600 ? `${limpio.slice(0, 597)}...` : limpio;
  }

  private buscarVozEspanola(voces: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    const minusculas = (voz: SpeechSynthesisVoice) => (voz.lang ?? '').toLowerCase();
    return (
      voces.find((voz) => minusculas(voz) === 'es-pe') ||
      voces.find((voz) => minusculas(voz).startsWith('es-')) ||
      voces.find((voz) => minusculas(voz).startsWith('es'))
    );
  }

  private cancelarVozPendiente(): void {
    if (this.temporizadorVoz !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.temporizadorVoz);
      this.temporizadorVoz = null;
    }
  }
}
