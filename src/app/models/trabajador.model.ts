export interface Trabajador {
  idTrabajador: number;
  idUsuario: number;
  dniUsuario: string;
  nombreCompletoUsuario: string;
  idLocal: number;
  nombreLocal: string;
  cargoTrabajador: string;
  fechaContratacion: string;
  /**
   * Baja lógica (RF10). El backend lo envía siempre como boolean
   * (las filas antiguas en `NULL` se reportan como activas), pero se
   * interpreta de forma defensiva con `!== false`.
   */
  estadoActivo: boolean;
}

export interface TrabajadorRequest {
  idUsuario: number;
  idLocal: number;
  cargoTrabajador: string;
  fechaContratacion?: string;
}