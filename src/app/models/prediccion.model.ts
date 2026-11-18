export type NivelRiesgo = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';

export interface PrediccionEscasez {
  idCategoria: number;
  nombreCategoria: string;
  unidadMedida: string | null;
  idZonaDesastre: number | null;
  nombreZona: string | null;
  stockActual: number;
  consumoDiario: number;
  diasAutonomia: number | null;
  nivelRiesgo: NivelRiesgo;
  critico: boolean;
  origenEstimacion?: 'MODELO_SINTETICO' | 'CALCULO_DIRECTO' | 'SIN_CONSUMO' | 'SIN_STOCK' | 'NO_ESPECIFICADO';
  mensaje: string;
}

export interface FiltrosPrediccion {
  idZonaDesastre?: number;
  idCategoria?: number;
}
