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

export interface AlertaCaducidad {
  idDetalle: number;
  nombreCategoria: string;
  descripcionDetalle: string;
  cantidad: number;
  fechaVencimiento: string;
  diasRestantes: number;
  nombreLocal?: string | null;
}