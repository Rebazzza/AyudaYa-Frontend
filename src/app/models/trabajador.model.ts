export interface Trabajador {
  idTrabajador: number;
  idUsuario: number;
  dniUsuario: string;
  nombreCompletoUsuario: string;
  idLocal: number;
  nombreLocal: string;
  cargoTrabajador: string;
  fechaContratacion: string;
}

export interface TrabajadorRequest {
  idUsuario: number;
  idLocal: number;
  cargoTrabajador: string;
  fechaContratacion?: string;
}