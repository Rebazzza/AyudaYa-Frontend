export interface HistorialEstado {
  idHistorial: number;
  idDonacion: number;
  estado: string;
  observacionHistorial: string | null;
  idLocal: number | null;
  idTrabajador: number | null;
  fechaCambio: string;
}

export interface HistorialRequest {
  idDonacion: number;
  estado: string;
  observacionHistorial?: string;
  idLocal?: number;
  idTrabajador?: number;
}