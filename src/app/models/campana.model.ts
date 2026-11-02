export interface MetaCampana {
  idMeta: number;
  idCategoria: number;
  nombreCategoria: string;
  unidadMedida: string;
  cantidadObjetivo: number;
  cantidadMinima: number;
}

export interface Campana {
  idCampana: number;
  nombreCampana: string;
  descripcion: string | null;
  zonaEmergencia: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  estadoVigencia: 'ACTIVA' | 'PROGRAMADA' | 'FINALIZADA' | 'INACTIVA';
  fechaCreacion: string;
  metas: MetaCampana[];
}

export interface MetaCampanaRequest {
  idCategoria: number;
  cantidadObjetivo: number;
  cantidadMinima: number;
}

export interface CampanaRequest {
  nombreCampana: string;
  descripcion?: string | null;
  zonaEmergencia: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  metas: MetaCampanaRequest[];
}

export interface AlertaStockCampana {
  idCampana: number;
  nombreCampana: string;
  zonaEmergencia: string;
  fechaFin: string;
  idCategoria: number;
  nombreCategoria: string;
  unidadMedida: string;
  stockActual: number;
  cantidadObjetivo: number;
  cantidadMinima: number;
  faltante: number;
  porcentajeCumplimiento: number;
  nivelAlerta: 'CRITICO' | 'EN_RIESGO';
}
