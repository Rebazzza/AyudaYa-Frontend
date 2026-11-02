export type EstadoLote = 'ARMADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';

export interface DonacionLote {
  idDonacion: number;
  codigoSeguimiento: string;
  estadoActual: string;
  idLocal: number | null;
  nombreLocal: string | null;
  direccionLocal: string | null;
  nombreDonante: string | null;
  cantidadProductos: number;
}

export interface KitLote {
  idKit: number;
  codigoKit: string;
  nombreKit: string;
  estado: string;
  idLocal: number | null;
  nombreLocal: string | null;
  cantidadInsumos: number;
}

export interface PuntoEntrega {
  codigo: string;
  tipo: 'DONACION' | 'KIT';
  descripcion: string;
  idLocal: number | null;
  nombreLocal: string | null;
  direccionLocal: string | null;
  latitud: number | null;
  longitud: number | null;
  cantidadBultos: number;
}

export interface LoteDistribucion {
  idLote: number;
  codigoLote: string;
  vehiculoPlaca: string;
  vehiculoModelo?: string | null;
  conductorNombre: string;
  zonaDesastre: string;
  estadoLote: EstadoLote | string;
  fotoEvidenciaUrl?: string | null;
  firmaDigitalBase64?: string | null;
  codigoConfirmacion?: string | null;
  firmaRegistrada: boolean;
  latitudEntrega?: number | null;
  longitudEntrega?: number | null;
  representanteNombre?: string | null;
  fechaDespacho?: string | null;
  fechaEntrega?: string | null;
  totalDonaciones: number;
  totalKits: number;
  donaciones: DonacionLote[];
  kits: KitLote[];
  puntosEntrega: PuntoEntrega[];
}

export interface CrearLoteRequest {
  idDonaciones: number[];
  idKits: number[];
  vehiculoPlaca: string;
  vehiculoModelo?: string | null;
  conductorNombre: string;
  zonaDesastre: string;
}

export interface EntregarLoteRequest {
  representanteNombre: string;
  firmaDigitalBase64?: string | null;
  codigoConfirmacion?: string | null;
  fotoEvidenciaUrl: string;
  latitudEntrega: number;
  longitudEntrega: number;
}
