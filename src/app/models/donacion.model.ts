export interface DetalleDonacion {
  idDetalle: number;
  idCategoria: number;
  nombreCategoria: string;
  descripcionDetalle: string;
  cantidadDeclarada: number;
  cantidadVerificada: number | null;
  fechaVencimiento: string | null;
}

export interface Donacion {
  idDonacion: number;
  codigoSeguimiento: string;
  fechaRegistro: string;
  fechaExpiracion: string | null;
  fechaVerificacion: string | null;
  estadoActual: string;
  idUsuario: number;
  dniDonante: string;
  nombreDonante: string;
  idLocalRecepcion: number;
  nombreLocal: string;
  direccionLocal?: string | null;
  idTrabajador: number | null;
  nombreTrabajador: string | null;
  detalles: DetalleDonacion[];
}

export interface DetalleDonacionRegistroRequest {
  idCategoria: number;
  descripcionDetalle?: string;
  cantidadDeclarada: number;
  fechaVencimiento?: string | null;
}

export interface DonacionRegistroRequest {
  idUsuario: number;
  idLocalRecepcion: number;
  detalles: DetalleDonacionRegistroRequest[];
}

export interface DetalleDonacionRequest {
  idCategoria: number;
  descripcionDetalle?: string;
  cantidadDeclarada: number;
  cantidadVerificada?: number | null;
  fechaVencimiento?: string | null;
}

export interface DonacionRequest {
  codigoSeguimiento: string;
  fechaExpiracion?: string | null;
  fechaVerificacion?: string | null;
  estadoActual: string;
  idUsuario: number;
  idLocalRecepcion: number;
  idTrabajador?: number;
  detalles: DetalleDonacionRequest[];
}

export interface CambioEstadoRequest {
  estado: string;
  observacionHistorial?: string;
  idLocal?: number;
  idTrabajador?: number;
}

export interface TrackingHistorial {
  estado: string;
  fechaCambio: string;
  observacion: string | null;
  nombreLocal: string | null;
}

export interface TrackingResponse {
  codigoSeguimiento: string;
  estadoActual: string;
  nombreLocal: string;
  direccionLocal: string;
  fechaRegistro: string;
  historial: TrackingHistorial[];
}