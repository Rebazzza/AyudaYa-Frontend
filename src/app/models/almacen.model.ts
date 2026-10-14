export interface DetalleCorroboracionRequest {
  idDetalle: number;
  cantidadVerificada: number;
}

export interface CorroboracionRequest {
  idDonacion: number;
  idLocal: number;
  idTrabajador?: number;
  latitud?: number;
  longitud?: number;
  detalles: DetalleCorroboracionRequest[];
}

export interface ResumenInventario {
  idCategoria: number;
  nombreCategoria: string;
  unidadMedida?: string | null;
  stockTotalVerificado: number;
  totalItemsIncidencia: number;
  requiereRefrigeracion: boolean;
}

export type EstadoConservacion = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'SIN_VENCIMIENTO';

export interface ProductoInventario {
  idDetalle: number;
  idDonacion: number;
  codigoSeguimiento: string;
  idCategoria: number;
  nombreCategoria: string;
  descripcionDetalle: string | null;
  cantidad: number;
  unidadMedida?: string | null;
  requiereRefrigeracion: boolean;
  fechaVencimiento?: string | null;
  estadoConservacion: EstadoConservacion;
}

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface FiltrosProductos {
  busqueda?: string;
  idCategoria?: number;
  estadoConservacion?: EstadoConservacion;
  pagina: number;
  tamanio: number;
}

export interface AlertaCaducidad {
  idDetalle: number;
  nombreCategoria: string;
  descripcionDetalle: string;
  cantidad: number;
  fechaVencimiento: string;
  diasRestantes: number;
  nombreLocal?: string | null;
}