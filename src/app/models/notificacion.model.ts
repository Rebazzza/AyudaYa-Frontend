export interface Notificacion {
  idNoti: number;
  idUsuario: number;
  idDonacion: number | null;
  mensajeNoti: string;
  leido: boolean;
  fechaEnvio: string;
}

export interface NotificacionRequest {
  idUsuario: number;
  idDonacion?: number;
  mensajeNoti: string;
}