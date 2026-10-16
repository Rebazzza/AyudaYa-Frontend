export type EstadoVerificacion = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
export type MetodoPago = 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
export type Moneda = 'PEN' | 'USD';

export const ESTADOS_VERIFICACION: EstadoVerificacion[] = ['PENDIENTE', 'VERIFICADO', 'RECHAZADO'];
export const METODOS_PAGO: MetodoPago[] = ['YAPE', 'PLIN', 'TRANSFERENCIA'];
export const MONEDAS: Moneda[] = ['PEN', 'USD'];

export const ETIQUETA_METODO: Record<string, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFERENCIA: 'Transferencia',
};

export const ETIQUETA_MONEDA: Record<string, string> = {
  PEN: 'Sol peruano',
  USD: 'Dólar estadounidense',
};

export const SIMBOLO_MONEDA: Record<string, string> = {
  PEN: 'S/',
  USD: 'US$',
};

/** Devuelve el símbolo de una moneda (`S/` por defecto). */
export function simboloMoneda(moneda?: string | null): string {
  return SIMBOLO_MONEDA[moneda ?? 'PEN'] ?? 'S/';
}

/** Formatea un monto con el símbolo de su moneda: `S/ 50.00`. */
export function formatearMonto(monto: number, moneda?: string | null): string {
  const valor = (monto ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${simboloMoneda(moneda)} ${valor}`;
}

export interface DonacionMonetaria {
  idDonacionMonetaria: number;
  idUsuario: number;
  nombreDonante?: string | null;
  monto: number;
  moneda?: string | null;
  metodoPago: string;
  numeroOperacion: string;
  comprobanteUrl?: string | null;
  /** true si el aporte tiene evidencia fotográfica adjunta */
  tieneComprobante?: boolean;
  estadoVerificacion: string;
  verificadoPor?: number | null;
  observacionesVerificacion?: string | null;
  fechaRegistro: string;
  fechaVerificacion?: string | null;
}

export interface DonacionMonetariaRegistroRequest {
  idUsuario: number;
  monto: number;
  moneda?: string;
  metodoPago: string;
  numeroOperacion: string;
  comprobanteUrl?: string;
}

/** Body de PUT /donaciones-monetarias/{id}/verificar (RF43). */
export interface VerificarFondosRequest {
  estado: EstadoVerificacion;
  /** Obligatorio cuando el estado es RECHAZADO (máx. 500 caracteres). */
  observacionVerificacion?: string;
  /** El backend no tiene JWT: hay que enviar siempre quién verifica. */
  idVerificador?: number;
}

export interface FiltroDonacionesMonetarias {
  estadoVerificacion?: string;
  metodoPago?: string;
  moneda?: string;
  idUsuario?: number;
  busqueda?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  tamanio?: number;
}

export interface PaginaDonacionesMonetarias {
  contenido: DonacionMonetaria[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface ItemDesgloseFondos {
  concepto: string;
  etiqueta: string;
  monto: number;
  cantidadDonaciones: number;
}

export interface PuntoSerieMensual {
  anio: number;
  mes: number;
  periodo: string;
  monto: number;
  cantidadDonaciones: number;
}

/** Respuesta de GET /donaciones-monetarias/panel (RF44). */
export interface PanelFondos {
  totalRecaudadoPEN: number;
  totalRecaudadoUSD: number;
  montoPendientePEN: number;
  montoRechazadoPEN: number;
  donacionesVerificadas: number;
  donacionesPendientes: number;
  donacionesRechazadas: number;
  totalDonaciones: number;
  desglosePorMoneda: ItemDesgloseFondos[];
  desglosePorMetodoPago: ItemDesgloseFondos[];
  serieMensual: PuntoSerieMensual[];
}
