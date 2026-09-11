export interface ActualizarUbicacionRequest {
  codigoSeguimiento: string;
  idLocalRecepcion: number;
  idTrabajador?: number;
  nuevoEstado: string;
  latitud?: number;
  longitud?: number;
  observacion?: string;
}

export interface UbicacionActual {
  codigoSeguimiento: string;
  estadoActual: string;
  nombreLocal: string;
  direccionLocal: string;
  latitudGPS: number | null;
  longitudGPS: number | null;
  fechaUltimoEscaneo: string | null;
}