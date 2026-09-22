export interface KitDetalle {
  idDetalleKit: number;
  idCategoria: number;
  nombreCategoria: string;
  unidadMedida?: string | null;
  cantidadInsumo: number;
}

export interface Kit {
  idKit?: number;
  codigoKit: string;
  idLocal?: number;
  nombreLocal?: string | null;
  nombreKit: string;
  estado: string;
  fechaArmado?: string | null;
  detalles: KitDetalle[];
}

export interface InsumoKit {
  idCategoria: number;
  cantidad: number;
}

export interface ArmarKitRequest {
  idLocal: number;
  nombreKit: string;
  cantidadKitsAFormar: number;
  insumosPorKit: InsumoKit[];
}